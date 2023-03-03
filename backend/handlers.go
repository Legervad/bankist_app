package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/dgrijalva/jwt-go"
)

//A map to store the user-token couples
//Normally I could store them in the DB but for simplicity I'll keep them in the RAM
var userTokens = make(map[string]string);

// Using the json struct tags, we simply match the json input and our struct.
// So when we unmarshal the json data, the row in the json with the key "userUsername" will be mapped to the user.UserUsername field.
type User struct {
	UserId int `gorm:"autoIncrement" gorm:"primaryKey" json:"userId"` 
	UserUsername string `json:"userUsername"`
	UserPassword int `json:"userPassword"`
	UserFullname string `json:"userFullname"`
	UserEmail string `json:"userEmail"`
	UserBalance int `json:"userBalance"`
}

type Transaction struct{
	TransactionId int `gorm:"autoIncrement" gorm:"primaryKey" json:"transactionId"`
	UserIdFrom int `json:"userIdFrom"`
	UserIdTo int `json:"userIdTo"`
	TransactionAmount int `json:"transactionAmount"`
}

type Claims struct {
	UserUsername string `json:"userUsername"`
	jwt.StandardClaims
}

var jwtKey = []byte("loihboug;p")
//=======================================

//Read the body of the request and return the corresponding 
func LoginHandler(w http.ResponseWriter, r *http.Request) {

	//Adjust the
	w.Header().Set("Content-Type", "application/json")
	// w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5500")
	// w.Header().Set("Access-Control-Allow-Credentials", "true")

	//Read the body
	var user User;
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		w.WriteHeader(400);
		// fmt.Println(56)
		return;
	}

	// Check if the user entered both the username and the password.
	// O/w return a 401
	if user.UserUsername == "" || user.UserPassword == 0 {
		w.WriteHeader(401)
		io.WriteString(w, "Please provide both the username and the password!")
		// fmt.Println(64)
		return
	}

	//Query for the given user, and check if it actually exists. DBden cekiyoruz yani.
	var currentUser User
	db.Table("users").Where("user_username = ?", user.UserUsername).Or("user_username = ?", user.UserUsername).First(&currentUser)

	//If the user with the given username does not exist or the passwords do not match RETURN
	if currentUser.UserId == 0 || currentUser.UserPassword != user.UserPassword {
		//Return 401 status code since the authentication FAILED
		w.WriteHeader(401)
		io.WriteString(w, "Username or Password is wrong!");
		// fmt.Println(76)
		return
	}
	// O/w the user exists and we will create the token 
	//First create the expirationTime. After 5 minutes the token expires
	expirationTime := time.Now().Add(time.Minute *2);

	claims := &Claims{
		UserUsername: user.UserUsername,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
		},
	};
	//Now we will use this Claims object and the jwtKey we defined earlier, and create 
	//the token out of them.

	// Also provide the signing algorithm
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims); 
	//Using this token, we will create the token string
	tokenString, err := token.SignedString(jwtKey);
	if err != nil {
		w.WriteHeader(500)
		// fmt.Println(98)
		return;
	}
	
	//No we are ready to set those things up in our cookies.
	http.SetCookie(w, 
		&http.Cookie{
			Name: "token",
			Value: tokenString,
			Expires: expirationTime,
		})
	
	// Add the username-token pair to out userTokens map
	userTokens[currentUser.UserUsername] = tokenString;
	
	// Return the currentUser's data within the response body.
	w.WriteHeader(200);
	json.NewEncoder(w).Encode(&currentUser)

	// fmt.Printf("The token string assigned =>  %s\n", tokenString);

	// Log the user's info into the console.
	fmt.Printf("A user logged in!\n\tFull Name: %s\n\tUsername: %s\n\tEmail: %s\n\tToken: %s\n", currentUser.UserFullname, currentUser.UserUsername, currentUser.UserEmail, tokenString);
}

func HomeHandler(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Content-Type", "application/json")
	// w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5500")
	// w.Header().Set("Access-Control-Allow-Credentials", "true")

	// We want to get the current user's username from the request body.
	// We will be using the username to get the user's token the local memory
	var user User;
	json.NewDecoder(r.Body).Decode(&user);


	//Check for the cookie
	cookie, err := r.Cookie("token")
	if err != nil {

		// If the cookie with the token is not included, we throw the unauthorized status code -401-. 
		//Also note that, when the cookie expires this if block is executed!
		if err == http.ErrNoCookie {
			w.WriteHeader(401)
			// fmt.Println(124)
			return;
		}
		w.WriteHeader(400) // o/w return bad request status code
		return
	}
	// If it is valid we get the cookie.value
	tokenStr := cookie.Value

	// fmt.Printf("The token string assigned =>  %s\n", tokenStr);
	//If the requested user's data does not belong to the current user then return
	if tokenStr != userTokens[user.UserUsername] {
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Println("You tried to access some other user's data!!")
		return;
	}

	claims := &Claims{}

	// We pass tokenStr, claims, and jwtKey as parameters to our function
	// Then we get the token. 
	tkn, err := jwt.ParseWithClaims(tokenStr, claims, 
		func(t *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	});

	if err != nil {
		if err == jwt.ErrSignatureInvalid {
			w.WriteHeader(401);
			// fmt.Println(145)
			
			return;
		}
		w.WriteHeader(400);
		return
	}

	// Check if the token is valid, if not then throw 401 status code, unauthorized
	if !tkn.Valid{
		w.WriteHeader(401);
		fmt.Println("TOKEN IS EXPIRED")
		return;
	}

	// At this point we know that the token is valid. So we return the data requested 
	// within the response body.

	//Set the content type to json
	w.Header().Set("Content-Type", "application/json")

	

	// Check if the user entered both the username and the password.
	// O/w return a 401
	if user.UserUsername == "" || user.UserPassword == 0 {
		w.WriteHeader(401)
		// fmt.Println(179)
		return
	}

	//Query for the given user, and check if it actually exists. DBden cekiyoruz yani.
	var currentUser User
	db.Table("users").Where("user_username = ?", user.UserUsername).Or("user_username = ?", user.UserUsername).First(&currentUser)


	var transactions []Transaction

	db.Table("transactions").Where("user_id_from = ?", currentUser.UserId).Or("user_id_to = ?", currentUser.UserId).Find(&transactions)

	//Return 200 status code and the corresponding data
	w.WriteHeader(200)
	json.NewEncoder(w).Encode(&transactions)
}

// Register a new user. We expect user_username, user_password, user_fullname, user_email, user_balance to be included in the
func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	
	w.Header().Set("Content-Type", "application/json")

	var user User
	json.NewDecoder(r.Body).Decode(&user);
	// Also initialize the balance to be 0
	user.UserBalance = 0;

	// Check if necessary information is complete
	// If not return 400
	if user.UserUsername == "" || user.UserFullname == "" || user.UserEmail == "" || user.UserPassword == 0{
		w.WriteHeader(400)
		io.WriteString(w, "Some fields are missing!");
		return
	}

	//Check if the username or email are already in the database
	var users []User

	// We query for the entered username and email. And put the result into the users array.
	// If the length of the array is not equal to 0 than that means there are rows with either the same
	// Username or the email. In that case RETURN.
	db.Table("users").Where("user_username = ?", user.UserUsername).Or("user_email = ?", user.UserEmail).Find(&users)
	if len(users) != 0 {
		w.WriteHeader(400)
		io.WriteString(w, "Username or email already exists!");
		return
	}


	w.WriteHeader(201);
	//Otherwise create the user
	db.Table("users").Select("UserUsername", "UserPassword", "UserFullname", "UserEmail", "UserBalance").Create(user)
	json.NewEncoder(w).Encode(user)

	fmt.Printf("A new user registered!\n\tFull Name: %s\n\tUsername: %s\n\tEmail: %s\n", user.UserFullname, user.UserUsername, user.UserEmail);
}

//We expect user_id_from, user_id_to, and transaction_amount.
func TransactionHandler(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5500")
	w.Header().Set("Access-Control-Allow-Credentials", "true")

	var transaction Transaction;
	err := json.NewDecoder(r.Body).Decode(&transaction);
	//Check if you successfully decoded the body, o/w throw 500, internal server err.
	if err != nil {
		fmt.Println("Could not decode the body!")
		w.WriteHeader(http.StatusInternalServerError);
		return
	}

	var username string;

	// First get the cookie==========================================================================================================
	cookie, err := r.Cookie("token")
	if err != nil {

		// If the cookie with the token is not included, we throw the unauthorized status code -401-. 
		// Also note that, when the cookie expires this if block is executed!
		if err == http.ErrNoCookie {
			w.WriteHeader(401)
			fmt.Println("You have no token!")
			return;
		}
		w.WriteHeader(400) // o/w return bad request status code
		// fmt.Println(271)
		return
	}
	// If it is valid we get the cookie.value
	tokenStr := cookie.Value

	// Get the current user's id using the token in the cookie.=======================================================================
	
	// Iterate over the map
	for k, v := range userTokens {
		if v == tokenStr { // That means we have found the user with the token we have in hand
			username = k;
			break;
		}
	}
	// If the token in the cookie does not match the local token, return 401, unauthorized.=====================================================
	if username == "" {
		fmt.Println("There is no user with the given token!")
		w.WriteHeader(http.StatusUnauthorized);
		return;
	}

	// Query for the user with the specific username and get the userid
	var userFrom User;
	db.Table("users").Where("user_username = ?", username).First(&userFrom);
	
	// Compare the current user's id with the user_id_from. They must match, o/w return 401, unauthorized.=====================================================
	if transaction.UserIdFrom != userFrom.UserId {
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Println("You cannot send money on behalf of someone else!")
		return;
	}

	// Query for the userTo, so that we can update their balances
	var userTo User;
	db.Table("users").Where("user_id = ?", transaction.UserIdTo).First(&userTo);

	// Afterwards, make sure that user_id_from is not the same as user_id_to, o/w return 400, bad request.=====================================================
	if transaction.UserIdFrom == transaction.UserIdTo {
		w.WriteHeader(http.StatusBadRequest)
		io.WriteString(w, "You cannot send money to yourself!");
		fmt.Println("You cannot send money to yourself!")
		return;
	}
	
	// Create the transaction in the database and return 201, created.=====================================================
	db.Table("transactions").Select("UserIdFrom", "UserIdTo", "TransactionAmount").Create(&transaction);

	// Update the balances of the users!
	db.Table("users").Where("user_id = ?", userFrom.UserId).Select("UserBalance").Updates(User{UserBalance: userFrom.UserBalance - transaction.TransactionAmount});
	db.Table("users").Where("user_id = ?", userTo.UserId).Select("UserBalance").Updates(User{UserBalance: userTo.UserBalance + transaction.TransactionAmount});

	// Return the status code
	w.WriteHeader(http.StatusCreated)
	// fmt.Println("Transaction successfully created!")
	fmt.Printf("A new transaction realized!\n\tFrom: %d\n\tTo: %d\n\tAmount: %d\n", userFrom.UserId, userTo.UserId, transaction.TransactionAmount);
}

// This function will realize the loan
// We expect user_id_to and transaction_amount.
func LoanHandler(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5500")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	
	// Get the transaction================================================================
	var transaction Transaction;
	err := json.NewDecoder(r.Body).Decode(&transaction);
	//Check if you successfully decoded the body, o/w throw 500, internal server err.
	if err != nil {
		fmt.Println("Could not decode the body!")
		w.WriteHeader(http.StatusInternalServerError);
		return
	}
	
	var username string;

	// First get the cookie==========================================================================================================
	cookie, err := r.Cookie("token")
	if err != nil {

		// If the cookie with the token is not included, we throw the unauthorized status code -401-. 
		// Also note that, when the cookie expires this if block is executed!
		if err == http.ErrNoCookie {
			w.WriteHeader(401)
			fmt.Println("You have no token!")
			return;
		}
		w.WriteHeader(400) // o/w return bad request status code
		// fmt.Println(271)
		return
	}
	// If it is valid we get the cookie.value
	tokenStr := cookie.Value

	// Get the current user's id using the token in the cookie.=======================================================================
	
	// Iterate over the map
	for k, v := range userTokens {
		if v == tokenStr { // That means we have found the user with the token we have in hand
			username = k;
			break;
		}
	}
	// If the token in the cookie does not match the local token, return 401, unauthorized.=====================================================
	if username == "" {
		fmt.Println("There is no user with the given token!")
		w.WriteHeader(http.StatusUnauthorized);
		return;
	}

	// Query for the user with the specific username and get the userid
	var user User;
	db.Table("users").Where("user_username = ?", username).First(&user);
	
	// Compare the current user's id with the user_id_from. They must match, o/w return 401, unauthorized.=====================================================
	if transaction.UserIdTo != user.UserId {
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Println("You cannot loan money on behalf of someone else!")
		return;
	}

	// Realize the loan=========================================================================================================================
	db.Table("transactions").Select("UserIdTo", "TransactionAmount").Create(&transaction);
	w.WriteHeader(http.StatusCreated);
	// fmt.Println("Succesfully created loan");

	// Update the balance of the user as well============================================================
	// fmt.Printf("Transaction amount is %d\nCurrent balance is %d\nNew balance is %d", transaction.TransactionAmount, user.UserBalance, transaction.TransactionAmount+user.UserBalance);

	//THAT IS HOW YOU UPDATE 			!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	db.Table("users").Where("user_id = ?", user.UserId).Select("UserBalance").Updates(User{UserBalance: transaction.TransactionAmount + user.UserBalance});

	// Log the loan info
	fmt.Printf("A user loaned money!\n\tUsername: %s\n\tUserId: %d\n\tAmount: %d\n", user.UserUsername, user.UserId, transaction.TransactionAmount);
}