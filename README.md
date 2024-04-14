# E-Learning Platform API

- It's a rest API where students can register, login and enroll in different courses available.
- All the endpoints are secured using Jason Web Tokens.
- Reset Password functionality is also available.
- Routes to Create, Update and Delete the courses, firstly checks if currentUser is a superuser of not and only "superuser" is authorized to perform CRUD operations.
- "superuser" can also register, login and reset password.
- Notification Emails will be sent automatically in case of Successful Registration, Password Reset or Enrolled in new course.
- image can be uploaded to make avatar(profile picture). If no image is given, the default image will be assigned to the user.

---

#### Features

- Endpoints are secured with Json Web Tokens
- Middlewares to check JWT and Access level (isSuperuser)
- Data validation using JOI package
- Logging information using Winston package
  - Logs are stored on Server and local file named "combined.log"
- Password Hashing and comparing using Bcrypt package
- CORS package to allow Cross-Origin Resource Sharing
- Automated Emails using Resend
- Avatar(image) is uploaded to "Cloudinary.com", its {url and filename} will be saved in "student" table under avatar column
  - If no "avatar(image)" is selected, the default image will be assigned to the user
  - To test image upload functionality, "imageTest.html" file is included
  - Image upload is achieved by using Multer package

---

### Database Structure

**There are 4 tables**

1. _Student Table_
   
   | id | name | email | password(hash) | avatar {url, filename} | enrolled_course |
   | -- | ---- | ----- | -------------- | ---------------------- | --------------- |

2. _SuperUser Table_
   
   | su_id | su_name | su_email | su_password(hash) |
   | ----- | ------- | -------- | ----------------- |

3. _Course Table_
   
   | course_id | course_name | category | level | total_enrollments |
   | --------- | ----------- | -------- | ----- | ----------------- |

4. _Log Table_
   
   | id | level (info/error) | message | timestamp |
   | -- | ------------------ | ------- | --------- |
   
---

#### npm start

- to start the environment

---

#### Seed Data

- All the tables can be created using seedData.js file.
- This file also contains dummy data that can also be inserted.
- Just uncomment the desired function and run "node app.js"

---

#### Test Accounts

_Student_
email : testaccount123@gmail.com  
password : Test@Account123

_Super User_
email : superadmin123@gmail.com  
password : Super@Admin123

---

#### Student Routes

**/login** (_POST_)

- requires an "email" and "password"
- returns a Json Web Token

**/register** (_POST_)

- requires "name", "email" and "password" (avatar image upload is optional)
- this data should be passed in a specific format ie.
  - student[name]
  - student[email]
  - student[password]
- for avatar image upload, the submit form should have "enctype = multipart/form-data"
- input field for image upload should look like `<input type='file' name='image'>`
- its important to name the input field as "image"
- this returns a Json Web Token.

**/reset-password** (_POST_)

- requires an "email"
- changes the password to a random string
- this password string will be then sent to the above email
- it returns a success message.

**/profile** (_GET_)

- requires a valid Json Web Token
- JWT should be sent via "Authorization" header (Authorization : Json Web Token)
- this returns an object containing all the information (profile) about the current user.

**/courses** (_GET_)

- this route uses "data filtering" and "pagination".
- requires a valid Json Web Token to access this route
- this route uses query string
  - name = "course_name" (eg. physics/chemistry/history etc)
  - category = (eg. science/commerce/arts etc)
  - level = (eg. beginner/intermediate/advance etc)
  - page = "page number" (should be a number), it's default value is 1
  - limit = "number of results per page" (should be a number), it's default value is 3 and maximum limit is 5
- all the above fields can be passed together, in combination or none at all.
- NOTE: none of the above queries are compulsory, if nothing is passed as query then it will show first 3 results from the list of all courses.

**/courses/:course_id/enroll** (_GET_)

- requires a valid Json Web Token
- a valid "course_id" should be passed in the url
- currentUser will be enrolled in the course who's "course_id" is passed in url
- this "course_id" gets added into the currentUser's "enrolled_course" list in "student" table
- also the "total_enrollments" of this course gets incremented by 1 in "course" table
- finally an Email will be sent to the currentUser's "email" to notify about the newly enrolled course.
- this returns a success message as a response

**/profile/my-courses** (_GET_)

- shows the enrolled_course list of currentUser
- requires a valid Json Web Token
- this route will return the list of courses currentUser is enrolled in ie. "enrolled_course"

---

#### Superuser Routes

**/login/su** (_POST_)

- log in as superuser
- requires an "email" and "password"
- returns a Json Web Token

**/register/su** (_POST_)

- creates a new superuser account
- requires "name", "email" and "password"
- this data should be passed in a specific format ie.
  - su[name]
  - su[email]
  - su[password]
- this returns a Json Web Token.

**/reset-password/su** (_POST_)

- resets the forgotten password
- requires an "email"
- changes the password to a random string
- this password string will be then sent to the above email
- it returns a success message.

---

#### CRUD Operations for Superuser

**/courses/new** (_POST_)

- creates a new course in "course" table
- requires a valid Json Web Token of superuser
- requires "course_name", "category" and "level" in body(x-www-form-urlencoded)
- "course_name" should be unique and not already present in the "course" table
- this creates a new course and returns a success message

**/courses/:course_id** (_PUT_)

- updates an existing course details
- requires a valid Json Web Token of superuser
- requires a valid "course_id" to be passed in url to update the course details
- requires "course_name", "category", "level" and "total_enrollments" in body(x-www-form-urlencoded)
- "course_name" should be unique and not already present in the "course" table
- updates the course details and returns a success message

**/courses/:course_id** (_DELETE_)

- deletes the course from "course" table
- requires a valid Json Web Token of superuser
- requires a valid "course_id" to be passed in url to delete the course
- deletes the course of passed "course_id" and returns a success message

---

#### Passwords

_Password must have :_

- At least one upper case English letter, (?=.\*?[A-Z])
- At least one lower case English letter, (?=.\*?[a-z])
- At least one digit, (?=.\*?[0-9])
- At least one special character, (?=._?[#?!@$%^&_-])
- Minimum eight in length .{8,}

---

##### Node Environment

- Logs are created only when NODE_ENV = "production"
  - logger => index.js =>
  ```
    if (process.env.NODE_ENV === 'production') {
    logger = appLogger();
    }
  ```
  - for development purposes, NODE_ENV !== 'production'. Change it back before going to production.
- .env file will not be configured in "production" environment
  - ```
    if (NODE_ENV !== "production") {
          require('dotenv').config();
      }
    ```
