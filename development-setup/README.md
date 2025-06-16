### Prerequisites
1. **Install Docker Desktop**: Ensure you have Docker Desktop installed and running on your machine.
2. **Node.js**: Make sure Node.js (version 18+) is installed.
3. **Clone the Repository**: Clone the project repository to your local machine.

### Setup Instructions
1. **Navigate to the Project Directory**:
   ```bash
   cd path/to/your/project
   ```

2. **Install Dependencies**:
   You can use the provided batch script or Makefile to install all dependencies:
   - For Windows:
     ```cmd
     scripts\dev-deploy.bat setup
     ```
   - For Linux/macOS:
     ```bash
     ./scripts/dev-deploy.sh setup
     ```
   - Alternatively, you can use the Makefile:
     ```bash
     make setup
     ```

3. **Configure Environment Variables**:
   - Copy the `.env.template` file to `.env` and fill in the required API keys and configurations.
   ```bash
   cp .env.template .env
   ```

4. **Start the Development Environment**:
   - For Windows:
     ```cmd
     scripts\dev-deploy.bat start
     ```
   - For Linux/macOS:
     ```bash
     ./scripts/dev-deploy.sh start
     ```
   - Using Makefile:
     ```bash
     make start
     ```

5. **Access the Application**:
   - **Frontend**: Open your browser and go to `http://localhost:3000`
   - **API Gateway**: Access the API Gateway at `http://localhost:8080`

### Additional Commands
- **Check Health**: You can check the health of the services using:
  ```bash
  ./scripts/dev-deploy.sh health
  ```
- **View Logs**: To view logs in real-time:
  ```bash
  ./scripts/dev-deploy.sh logs --follow
  ```

### Notes
- If you make changes to the code, you can use hot reload features to see changes without rebuilding the Docker containers.
- Ensure that all required API keys are set in the `.env` file for the services to function correctly.

By following these steps, you should be able to successfully start the local development environment for the Anti-Fraud Platform project.