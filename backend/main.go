// gorilla/mux library for routing, the built-in net/http library for http requests, gorm for querying
package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"

	"github.com/jinzhu/gorm"

	_ "github.com/jinzhu/gorm/dialects/postgres"
	"github.com/rs/cors"
)

var db *gorm.DB;
var err error;

type Logger struct {
    handler http.Handler
}

//ServeHTTP handles the request by passing it to the real
//handler and logging the request details
func (l *Logger) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    start := time.Now()
    l.handler.ServeHTTP(w, r)
    log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
}

func main()  {
	dsn := "host=localhost user=postgres password=7331476 dbname=postgres port=5432 sslmode=disable"
	db, err = gorm.Open("postgres", dsn)
	if err != nil {
		panic(err)
	}
	router := mux.NewRouter();

	// You should work with localhost:5500, I don't know why but the other one creates problems
	corsWrapper := cors.New(cors.Options{
        AllowedMethods: []string{"GET", "POST", "DELETE", "UPDATE"},
        AllowedHeaders: []string{"Content-Type", "Origin", "Accept"},
		AllowedOrigins: []string{"http://localhost:5500", "http://127.0.0.1:5500"}, //THIS MUST BE SET!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		AllowCredentials: true,
  	})
	
	//Define the ROUTES
	router.HandleFunc("/login", LoginHandler).Methods("POST");
	router.HandleFunc("/home", HomeHandler).Methods("POST");
	router.HandleFunc("/register", RegisterHandler).Methods("POST");
	router.HandleFunc("/transaction", TransactionHandler).Methods("POST");
	router.HandleFunc("/loan", LoanHandler).Methods("POST");

	handler := corsWrapper.Handler(router);
	
	log.Fatal(http.ListenAndServe(":8080", handler))
	

}