# INFLUX-UI-UG-1

## Table of Contents 
- [Tool Description](#tool-description)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation and Setup](#installation-and-setup)
- [Files Included](#files-included)
- [Usage Examples](#usage-examples)
- [Troubleshooting Guide](#troubleshooting-guide)
- [Contributors](#contributors)
- [Acknowledgements](#acknowledgements)

## Description
Influx-UI-UG-1 is a custom-built application for InfluxDB, with seamless integration into Grafana for data visualisation. 
This interface provides an intuitive approach to manage, query, and visualise time-series metrics with a focus on user-friendliness and developer productivity.

The goal of this project is to bridge the gap between data collection and data visualisation, making InfluxDB easier to manage while enabling secure and efficient integration with Grafana.

## Features
- Seamless Grafana Integration for visualisation 
- Support for multiple dashboard tabs
- Light/Dark mode toggle for better user experience
- Secure authentication and authorization
- Clean, modern, and user-friendly UI

## Tech Stack
- Frontend: React, HTML, CSS
- Backend: Node.js, Express
- Database: InfluxDB
- Visualisation: Grafana
- Other tools/libraries:
   - Middleware and utility functions for secure API handling
   - NPM for package and dependency management

## Project Structure
```bash
INFLUX-UI-UG-1/
├── backend/                # Backend API server
│   ├── index.js            # Entry point for backend server
│   ├── routes/             # API route handlers
│   ├── middleware/         # Custom middleware (e.g., authentication, logging)
│   ├── utils/              # Helper/utility functions
│   ├── generated/          # Auto-generated files/configs
│   ├── package.json        # Backend dependencies
│   └── README.md
│
├── frontend/               # Frontend React application
│   ├── public/             # Static assets
│   ├── src/                # React components, pages, and logic
│   ├── package.json        # Frontend dependencies
│   └── README.md
│
├── node_modules/           # Root-level dependencies
├── package.json            # Root project configuration
├── package-lock.json
└── README.md               # Project documentation
```

## Installation and Setup
### Prerequisites
- Node.js
- npm
- Access to InfluxDB and Grafana instances (you will need to use your login credentials with InfluxDB and Grafana, such as your access token and organisation name)

### Steps
1. Clone this repository to your local machine
```bash
git clone https://github.cs.adelaide.edu.au/a1881053/INFLUX-UI-UG-1.git
```
2. Navigate to the root directory 
```bash
cd INFLUX-UI-UG-1
```
3. Install the necessary dependencies
```bash
npm install
```
4. Create a **.env** file in `/backend` with following content:
```bash
DB_USER=yourname
DB_HOST=localhost
DB_NAME=influx01
DB_PASSWORD=yourpassword
DB_PORT=5432
JWT_SECRET=influx-db-01

INFLUX_URL=yourInfluxDBurl
INFLUX_TOKEN=yourInfluxDBtoken
INFLUX_ORG=yourOrgName

GRAFANA_URL=https://yourUserName.grafana.net/
GRAFANA_TOKEN=yourGrafanaToken
```

5. Launch the application
```bash
npm run start:all
```

## Files Included
- backend/ - Contains server-side logic, middleware, routes, and utilities
- frontend/ - Contains the React UI application such as components, pages, and styling.
- package.json - Project metadata and scripts
- README.md - Project Documentation

## Usage Examples
You have three login options: 
1. **_Influx only_**
- Add your *InfluxDB URL*, *Organisation name*, and *access token* in the login form.
- You will be directed to the Influx dashboard, where you can view and query time-series data.
2. **_Grafana only_**
- Use your *Service Account Token*, *Grafana Organisation ID*, and *Grafana URL* to login.
- The application will fetch and display your Grafana dashbaords once logged in.
3. **_login via InlfuxDB and Grafana_**
- Use your *InfluxDB Token* and *Grafana Token* to login.
- This option enables full integration and cross-visualisation between your InfluxDB data and Grafana dashboards.
- This is ideal for users managing metrics and visualisations in a single workspace.


## Troubleshooting Guide
- **Issues with dependencies missing or not fully installing**: Delete `node_modules/` and `package-lock.json`, then run `npm install` again.
- **Either InfluxDB or Grafana connection failing**: This is due to *incorrect or invalid API token, URL, or organisation name*. Double check your login credentials and if needed, generate a new token, and update your .env.
- **Environment variables not loading**: this is due to missing or invalid *.env*. Ensure your *.env* file is inside `/backend` and formatted correctly.
- **Login shows *server error***: this is caused by *backend* not running or crashing. Check the terminal for backend errors and install any missing packages.

## Contributors
This project was developed by students of the InfluxDB UG-1 group:
- Christina Nguyen a1797406
- Kriti Aggarwal a1881175
- Lakshya Patel a1885152
- Ngoc Thuy Tram Nguyen a1881053
- Samira Hazara a1852922
- Thi Phuong Thao Truong a1904431
- Thuy Linh Nguyen a1868677

## Acknowledgements
Pull requests, suggestions, and bug reports are welcome. 

For significant contributions, please open an issue first to discuss your ideas.
