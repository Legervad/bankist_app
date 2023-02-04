'use strict';
import * as utility from './utility.js';
import * as classes from './classes.js';
import * as opt from './fetchOptions.js';

// Data
const account1 = {
    owner: 'Jonas Schmedtmann',
    movements: [200, 450, -400, 3000, -650, -130, 70, 1300],
    interestRate: 1.2, // %
    pin: 1111,
};
const account2 = {
    owner: 'Jessica Davis',
    movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
    interestRate: 1.5,
    pin: 2222,
};

const account3 = {
    owner: 'Steven Thomas Williams',
    movements: [200, -200, 340, -300, -20, 50, 400, -460],
    interestRate: 0.7,
    pin: 3333,
};

const account4 = {
    owner: 'Sarah Smith',
    movements: [430, 1000, 700, 50, 90],
    interestRate: 1,
    pin: 4444,
};

let accounts = [account1, account2, account3, account4];

// Elements
const labelWelcome = document.querySelector('.welcome');
const labelDate = document.querySelector('.date');
const labelBalance = document.querySelector('.balance__value');
const labelSumIn = document.querySelector('.summary__value--in');
const labelSumOut = document.querySelector('.summary__value--out');
const labelSumInterest = document.querySelector('.summary__value--interest');
const labelTimer = document.querySelector('.timer');

const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');
const containerLogin = document.querySelector('.login');

const btnLogin = document.querySelector('.login__btn');
const btnTransact = document.querySelector('.form__btn--transfer');
const btnLoan = document.querySelector('.form__btn--loan');
const btnClose = document.querySelector('.form__btn--close');
const btnSort = document.querySelector('.btn--sort');
const btnRegister = document.querySelector('.register-anchor');

const inputLoginUsername = document.querySelector('.login__input--user');
const inputLoginPin = document.querySelector('.login__input--pin');
const inputTransferTo = document.querySelector('.form__input--to');
const inputTransferAmount = document.querySelector('.form__input--amount');
const inputLoanAmount = document.querySelector('.form__input--loan-amount');
const inputCloseUsername = document.querySelector('.form__input--user');
const inputClosePin = document.querySelector('.form__input--pin');

let currentUser;
let currentTransactions;
let myTimeout;

btnLogin.addEventListener(`click`, function (e) {
    e.preventDefault();

    containerLogin.style.opacity = 0;
    currentUser = null;
    currentTransactions = [];

    // Instantiate an object literal with userUsername, userPassword
    const requestUser = {
        userUsername: inputLoginUsername.value,
        userPassword: Number(inputLoginPin.value),
    };
    // Using the literal send the request
    fetch('http://localhost:8080/login', opt.loginOptions(requestUser))
        .then(response => {
            console.log(response.statusText);
            return response.json();
        })
        .then(response => {
            //Create the current user object
            currentUser = new classes.User(response.userId, response.userUsername, response.userPassword, response.userFullname, response.userEmail, response.userBalance);

            // Update the welcome text, balance text and username-password texts
            labelWelcome.textContent = `Welcome ${currentUser.userFullname.split(` `)[0]}!
            <${currentUser.userId}>`;
            labelBalance.textContent = `You have ${currentUser.userBalance} 💶!`;
            inputLoginUsername.value = inputLoginPin.value = ``;
            inputLoginPin.blur();

            //Send request to the server
            fetch('http://localhost:8080/home', opt.homeOptions(requestUser))
                .then(response => {
                    console.log(response);
                    console.log(response.statusText);
                    return response.json();
                })
                .then(response => {
                    console.log(response);
                    currentTransactions = response.reduce((acc, e) => {
                        //If the transaction's userIdTo field is equal to the current user's id then it means that it is a deposit. o/w it is a withdrawal so multiply it by -1
                        if (e.userIdTo === currentUser.userId) {
                            acc.push(e.transactionAmount);
                        } else {
                            acc.push(e.transactionAmount * -1);
                        }

                        return acc;
                    }, []);
                    // console.log(`currentTransactions array is ${currentTransactions}`);
                })
                .then(() => {
                    console.log(`Movements right below`);
                    console.log(currentTransactions);

                    utility.calcDisplaySummary(currentTransactions, labelSumIn, labelSumOut);
                    utility.displayMovements(currentTransactions, containerMovements);

                    console.log(currentUser);
                    containerApp.style.opacity = 100;

                    // Call the settimeout function so that after some time the
                    myTimeout = setTimeout(() => {
                        currentUser = null;
                        currentTransactions = [];
                        containerApp.style.opacity = 0;
                        containerLogin.style.opacity = 100;
                        labelWelcome.innerHTML = `<p class="welcome">Log in to get started, or <a class="register-anchor" href="">register</a> now!</p>`;
                        labelBalance.textContent = ``;

                        utility.calcDisplaySummary(currentTransactions, labelSumIn, labelSumOut);
                        utility.displayMovements(currentTransactions, containerMovements);
                    }, 120000);
                });
        });
});

btnTransact.addEventListener(`click`, function (e) {
    e.preventDefault();

    // Create transaction object, and fill its user_if_from user_id_to and transaction_amount
    let currTransaction = new classes.Transaction();

    currTransaction.transactionAmount = Number(inputTransferAmount.value);
    currTransaction.userIdFrom = currentUser.userId;
    currTransaction.userIdTo = Number(inputTransferTo.value);

    // If our balance is less than the amount we are trying to transfer we shouldn't be able to realize the transaction.
    if (currentUser.userBalance < currTransaction.transactionAmount) {
        alert(`You don't have enought money!`);
        inputTransferAmount.value = '';
        inputTransferTo.value = '';
        return;
    }

    // Send the request to the server

    fetch('http://localhost:8080/transaction', opt.transactionOptions(currTransaction))
        .then(response => {
            // That means we failed to realize the transaction
            if (response.status != 201) {
                throw new Error(`Failed to realize the transaction ${response.statusText}!`);
            }
        })
        .then(() => {
            //Since we are sending money, the transaction amount should be added as negative
            currentTransactions.push(-currTransaction.transactionAmount);
            utility.calcDisplaySummary(currentTransactions, labelSumIn, labelSumOut);
            utility.displayMovements(currentTransactions, containerMovements);
            utility.balanceAdd(labelBalance, -currTransaction.transactionAmount);

            // Don't forget to update the currentUser's balance as well.
            currentUser.userBalance -= currTransaction.transactionAmount;
        });
});

btnClose.addEventListener(`click`, function (e) {
    e.preventDefault();
    if (currentUser.username === inputCloseUsername.value && currentUser.pin === Number(inputClosePin.value)) {
        accounts = accounts.filter(acc => acc.username !== inputCloseUsername.value);
        containerApp.style.opacity = 0;

        labelWelcome.textContent = `Login to get started`;
        inputClosePin.value = inputCloseUsername.value = ``;
    }
});

//You can loan if you have at least 10% of the amount you requested as a deposit
btnLoan.addEventListener(`click`, function (e) {
    e.preventDefault();

    utility.sleep(2000);

    // Create the transaction object
    let currTransaction = new classes.Transaction();

    // Read the input from the frontend
    currTransaction.userIdTo = currentUser.userId;
    currTransaction.transactionAmount = Number(inputLoanAmount.value);

    // Send the request to the server using the fetch api

    fetch('http://localhost:8080/loan', opt.loanOptions(currTransaction))
        .then(response => {
            //The request did not succeed return!
            console.log(`Response status is ${response.status} its type is ${typeof response.status}`);
            if (response.status != 201) {
                throw new Error(`Request failed, ${response.statusText}!`);
            }
        })
        .then(() => {
            // If we are here then we know that our request was successfull
            // The db is updated in the backend so no worries!

            // Update the current transactions array
            currentTransactions.push(currTransaction.transactionAmount);

            // and call the utility functions
            utility.calcDisplaySummary(currentTransactions, labelSumIn, labelSumOut);
            utility.displayMovements(currentTransactions, containerMovements);
            utility.balanceAdd(labelBalance, currTransaction.transactionAmount);

            // Also update the currentUser object's userBalance so that following actions can know of that.
            currentUser.userBalance += currTransaction.transactionAmount;
        })
        .catch(error => console.log(error));
});

btnRegister.addEventListener(`click`, function (e) {
    e.preventDefault();

    //REGISTER THE USER
});

let sorted = false;
btnSort.addEventListener(`click`, function (e) {
    e.preventDefault();
    if (!sorted) {
        console.log(`first if`);
        utility.displayMovements(
            [...currentTransactions].sort((a, b) => a - b),
            containerMovements
        );
        sorted = true;
    } else if (sorted) {
        console.log(`second if`);
        utility.displayMovements(currentTransactions, containerMovements);
        sorted = false;
    }
});
