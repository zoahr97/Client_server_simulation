# End-to-End Client–Server Application Simulation

**Academic grade: 98/100**

This project is an end-to-end client–server application simulation built with HTML, CSS, and JavaScript. It demonstrates how a real web application is structured and how its client, server, communication layer, and database work together.

The client side is implemented as a Single Page Application (SPA), with pages for user registration, login, and managing application data. Users can view, search, add, update, and delete their own records through a dynamic interface.

Instead of using a real server, the project simulates a client-server environment. The client sends asynchronous FAJAX requests in a REST API style. A simulated network layer transfers requests to the appropriate server with random delays and potential communication failures. The server validates requests, checks authorization, accesses the appropriate data layer, and sends a response back to the client.

The project contains separate layers for the client application, authentication server, application data server, network communication, FAJAX mechanism, and database access. Data is stored locally with Local Storage and managed through a defined database API.

## Key Features

- Single Page Application (SPA) architecture
- User registration, login, and authorization
- Simulated REST API operations: GET, POST, PUT, and DELETE
- Asynchronous FAJAX communication
- Simulated network delays and message loss
- Separate authentication and application-data servers
- Separate user and application-data repositories
- Local Storage-based persistence
- CRUD operations: create, read, update, delete, and search
- Modular separation between client, server, network, and database layers
- JSON-based request and response handling

## Technologies

**Frontend:** HTML, CSS, JavaScript  
**Architecture:** SPA, Client–Server Simulation  
**Communication:** REST API, FAJAX, JSON  
**Storage:** Local Storage  
**Tools:** Git and GitHub
