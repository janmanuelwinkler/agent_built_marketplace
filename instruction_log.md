Hi,
I want to build a webpage to sell secondhand stuff like iphones and furniture. A good example is ricardo.ch for Switzerland.
Users should be able to upload new articles very easily and then one can bid.
Can you prepare a simple POC in this folder. Ideally the page can be deployed on cloud. I'm not sure but it might be best to work in a docker container. Ideally the frontend is a standard web app and the backend in python.

Created an initial dict but there was an error in the db.
Killed agent after several attempts to fix
proposed docker-compose instead of docker compose

first running version

create a new branch in the repo and push to remote git
please call the branch "user-login" and check it out 

 now i would like to improve the "register" section of my page. A user should create an account where he needs to provide a username and set a password. when registering the user needs to provide: name, address, mail address, age, phone number. later a user should be able to log into the page by using username and password

 the form should be in german and i need to be more precise with the fields and the enforced formatting:
 "Vorname": "Luca",
  "Nachname": "Meier",
  "geburtsdatum": "12-03-1990",
  "adresse": {
    "Strasse": "Bahnhofstrasse",
    "Hausnummer": "10",
    "Postleitzahl": "8001",
    "Ort": "Zürich",
    "Land": "Schweiz" (default and then list of countries)
  },
  "email": "luca.meier@example.ch",
  "Telefon": "+41791234567",
  "passwort": "gehashter-passwortwert",
  "datenschutz_zugestimmt": true
}

Adjusted birth date to new format. works very well.
