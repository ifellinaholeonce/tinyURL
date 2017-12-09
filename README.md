# TinyURL Project

TinyURL is a full stack web application built with Node and Express that allows users to shorten long URLs (a la bit.ly)

## Final Product

!["Landing Page for users not logged in"](https://github.com/ifellinaholeonce/tinyURL/blob/master/docs/landing.png?raw=true)
!["Registration Page for users create an account"](https://github.com/ifellinaholeonce/tinyURL/blob/master/docs/register.png?raw=true)
!["List of all your shortened URLs: delete them, edit them and see a brief overview of the traffic that has gone through."](https://github.com/ifellinaholeonce/tinyURL/blob/master/docs/urls_index.png?raw=true)
!["Edit your short URL's destination. See the amount of visitors and unique visitors for your short URL"](https://github.com/ifellinaholeonce/tinyURL/blob/master/docs/url_edit.png?raw=true)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session

## Getting Started

- Install all dependencies `npm install`
- Run the development web server `node server.js`

## Features

- TinyURL allows the user to access and edit all of the URLs they have shortened
- Users can delete individual TinyURLs they have created - stopping shared TinyURLs from working.
- Users can see the number of views and unique visitors their shortened URLs have generated