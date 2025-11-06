## AngulareCommerceDsMicroServices_20

**AngulareCommerceDsMicroServices_20** is an e-commerce application developed with Angular 20.1.2. Its main objective is to allow users to browse and purchase albums from different bands and music genres, as well as manage their orders and shopping carts. The application has two main areas of functionality: one for general users and one for administrators. For general users: Registration and Login, Product Browsing, Shopping Cart and Order Management. For administrators: Genre Management, Group Management, Album Management, User Management, Order Management (Admin) and Cart Management (Admin). It uses Bootstrap 5, PrimeNG and JWT for authentication. It uses a microservices architecture where the Angular application acts as a frontend client that connects to multiple backend REST APIs. Access is done through three main microservices: userService (port 7170): Handles authentication and user management; cdService (port 7262): Manages albums, bands, and genres; and shoppingService (port 7273): Handles shopping carts and orders. The architecture implements a distributed API Gateway pattern where each Angular service directly knows the microservices' URLs. Authentication is stateless through JWT, allowing each microservice to independently validate requests without the need for shared sessions. 

![AngulareCommderceDs](img/UML.png)

AngulareCommerceDsMicroServices_20/  
├───app/  
│   ├───ecommerce/  
│   │   ├───admin-orders/  
│   │   │   ├───admin-orders.css  
│   │   │   ├───admin-orders.html  
│   │   │   └───admin-orders.ts  
│   │   ├───cart-details/  
│   │   │   ├───cart-details.css  
│   │   │   ├───cart-details.html  
│   │   │   └───cart-details.ts  
│   │   ├───carts/  
│   │   │   ├───carts.css  
│   │   │   ├───carts.html  
│   │   │   └───carts.ts  
│   │   ├───genres/  
│   │   │   ├───genres.html  
│   │   │   └───genres.ts  
│   │   ├───groups/  
│   │   │   ├───groups.html   
│   │   │   └───groups.ts  
│   │   ├───list-groups/  
│   │   │   ├───list-groups.html     
│   │   │   └───list-groups.ts  
│   │   ├───list-records/  
│   │   │   ├───list-records.html      
│   │   │   └───list-records.ts  
│   │   ├───orders/  
│   │   │   ├───orders.html   
│   │   │   └───orders.ts  
│   │   ├───records/  
│   │   │   ├───records.html  
│   │   │   └───records.ts  
│   │   ├───services/  
│   │   │   ├───cart.ts  
│   │   │   ├───cart-detail.ts  
│   │   │   ├───genres.ts  
│   │   │   ├───groups.ts  
│   │   │   ├───order.ts  
│   │   │   ├───records.ts  
│   │   │   ├───stock.ts  
│   │   │   └───users.ts  
│   │   ├───users/  
│   │   │   ├───users.html    
│   │   │   └───users.ts  
│   │   ├───ecommerce.html  
│   │   ├───ecommerce.ts  
│   │   ├───ecommerce.interface.ts  
│   ├───guards/  
│   │   └───auth-guard.ts    
│   ├───interceptors/  
│   │   └───auth-interceptor.ts  
│   ├───interfaces/  
│   │   ├───login.interface.ts  
│   │   └───register.interface.ts  
│   ├───services/  
│   │   ├───app.ts  
│   │   └───user.ts  
│   ├───shared/  
│   │   ├───login/  
│   │   │   ├───login.css  
│   │   │   ├───login.html  
│   │   │   └───login.ts  
│   │   ├───navbar/  
│   │   │   ├───navbar.html     
│   │   │   └───navbar.ts  
│   │   ├───register/  
│   │   │   ├───register.css  
│   │   │   ├───register.html  
│   │   │   └───register.ts  
│   ├───app.css   
│   ├───app.html   
│   ├───app.ts  
│   └───app.routes.ts    
├───environments/  
│   ├───environment.development.ts  
│   └───environment.ts  
├───main.ts   
├───angular.json    
└───package.json  

![AngulareCommderceDs](img/01.png)
![AngulareCommderceDs](img/02.png)
![AngulareCommderceDs](img/03.png)
![AngulareCommderceDs](img/04.png)
![AngulareCommderceDs](img/05.png)
![AngulareCommderceDs](img/06.png)
![AngulareCommderceDs](img/07.png)
![AngulareCommderceDs](img/08.png)
![AngulareCommderceDs](img/09.png)
![AngulareCommderceDs](img/10.png)
![AngulareCommderceDs](img/11.png)
![AngulareCommderceDs](img/12.png)
![AngulareCommderceDs](img/13.png)
![AngulareCommderceDs](img/14.png)
![AngulareCommderceDs](img/15.png)
![AngulareCommderceDs](img/16.png)
![AngulareCommderceDs](img/17.png)

## environment

```javascript
export const environment = {
  // API Base URLs
  apiUrl: {
    userService: 'https://localhost:7170/api/',
    cdService: 'https://localhost:7262/api/',
    shoppingService: 'https://localhost:7273/api/'
  },
};

```

[DeepWiki moraisLuismNet/AngulareCommerceDsMicroServices_20](https://deepwiki.com/moraisLuismNet/AngulareCommerceDsMicroServices_20)


## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

