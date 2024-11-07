import os
import jwt
import dotenv
from fastapi import FastAPI, HTTPException, status, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mysql.connector import connect, Error as MySQLError, errorcode

# Load environment variables from the .env file
dotenv.load_dotenv()

# Initialize the FastAPI app
app = FastAPI()

# Define the allowed origins for CORS
origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the request body model for login
class LoginRequest(BaseModel):
    voter_id: str
    password: str

# Database dependency
def get_db_connection():
    try:
        # Use environment variables for database credentials
        cnx = connect(
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            port=int(os.getenv('DB_PORT', 3307))  # Use port 3307 if DB_PORT is not set
        )
        yield cnx
    except MySQLError as err:
        print("Database connection error:", err)
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            detail = "Something is wrong with your username or password"
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
            detail = "Database does not exist"
        else:
            detail = "Database connection failed"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail
        )
    finally:
        if cnx.is_connected():
            cnx.close()

# Helper function to retrieve user role
async def get_role(voter_id: str, password: str, db):
    cursor = db.cursor()
    query = "SELECT role FROM voters WHERE voter_id = %s AND password = %s"
    try:
        cursor.execute(query, (voter_id, password))
        role = cursor.fetchone()
        if role:
            return role[0]
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid voter ID or password"
            )
    finally:
        cursor.close()

# Define the POST endpoint for login
@app.post("/login")
async def login(request: LoginRequest, db=Depends(get_db_connection)):
    role = await get_role(request.voter_id, request.password, db)

    # Generate a JWT token upon successful authentication
    token = jwt.encode(
        {'voter_id': request.voter_id, 'role': role},
        os.getenv('SECRET_KEY'),
        algorithm='HS256'
    )

    return {'token': token, 'role': role}

# Run the app
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)


