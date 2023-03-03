'use strict';
import * as utility from './utility.js';
import * as classes from './classes.js';
import * as opt from './fetchOptions.js';

// Elements
const labelWelcome = document.querySelector('.welcome');
const labelDate = document.querySelector('.date');
const labelBalance = document.querySelector('.balance__value');
const labelSumIn = document.querySelector('.summary__value--in');
const labelSumOut = document.querySelector('.summary__value--out');
const labelTimer = document.querySelector('.timer');

const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');
const containerLogin = document.querySelector('.login');

const btnLogin = document.querySelector('.login__btn');
const btnTransact = document.querySelector('.form__btn--transfer');
const btnLoan = document.querySelector('.form__btn--loan');
const btnSort = document.querySelector('.btn--sort');
const btnRegister = document.querySelector('.register-anchor');

const inputLoginUsername = document.querySelector('.login__input--user');
const inputLoginPin = document.querySelector('.login__input--pin');
const inputTransferTo = document.querySelector('.form__input--to');
const inputTransferAmount = document.querySelector('.form__input--amount');
const inputLoanAmount = document.querySelector('.form__input--loan-amount');

// Registration modal
const overlay = document.querySelector(`.overlay`);
const closeModalButton = document.querySelector(`.close-modal`);
const modal = document.querySelector(`.modal`);

const registrationForm = document.getElementById('registration-form');
const userName = document.getElementById('user-name');
const userSurname = document.getElementById('user-surname');
const userUsername = document.getElementById('user-username');
const userPassword = document.getElementById('user-password');
const userMail = document.getElementById('user-email');

let currentUser;
let currentTransactions;
let myTimeout;
let myTimeInterval;

btnLogin.addEventListener(`click`, function (e) {
    e.preventDefault();

    currentUser = null;
    currentTransactions = [];

    // Instantiate an object literal with userUsername, userPassword
    const requestUser = {
        userUsername: inputLoginUsername.value,
        userPassword: Number(inputLoginPin.value),
    };
    // Using the literal send the request
    let statusCode;
    fetch('http://localhost:8080/login', opt.loginOptions(requestUser))
        .then(response => {
            //If the status code is not 200 then return the error text.
            statusCode = response.status;
            console.log(response.status);
            if (statusCode != 200) {
                return response.text();
            }
            return response.json();
        })
        .then(response => {
            console.log(statusCode);
            if (statusCode != 200) {
                alert(response);
                throw new Error(response);
            }
            containerLogin.style.opacity = 0;
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

                    // Call the settimeout function so that after some time the session is over
                    myTimeInterval = utility.updateTimer(labelTimer);
                    myTimeout = setTimeout(() => {
                        currentUser = null;
                        currentTransactions = [];
                        containerApp.style.opacity = 0;
                        containerLogin.style.opacity = 100;
                        labelWelcome.innerHTML = `<p class="welcome">Log in to get started, or <a class="register-anchor" href="">register</a> now!</p>`;
                        labelBalance.textContent = ``;
                        labelTimer.textContent = `02:00`;
                        inputLoanAmount.value = ``;
                        inputTransferAmount.value = ``;
                        inputTransferTo.value = ``;

                        utility.calcDisplaySummary(currentTransactions, labelSumIn, labelSumOut);
                        utility.displayMovements(currentTransactions, containerMovements);

                        // Clear myTimeInterval
                        clearInterval(myTimeInterval);
                    }, 121000);
                })
                .catch(error => console.log(error));
        });
});

btnTransact.addEventListener(`click`, function (e) {
    e.preventDefault();

    utility.sleep(2000);

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

    // Don't forget to update the currentUser's balance as well.
    currentUser.userBalance -= currTransaction.transactionAmount;
    inputTransferTo.value = '';
    inputTransferAmount.value = '';

    // Send the request to the server
    let statusCode;
    fetch('http://localhost:8080/transaction', opt.transactionOptions(currTransaction))
        .then(response => {
            // That means we failed to realize the transaction
            statusCode = response.status;
            console.log(response.status);
            if (response.status != 201) {
                return response.text();
            }
        })
        .then(data => {
            if (statusCode != 201) {
                alert(data);
                throw new Error(`Failed to realize the transaction ${response.statusText}!`);
            } else {
                alert('Successfully realized the transaction!');
                //Since we are sending money, the transaction amount should be added as negative
                currentTransactions.push(-currTransaction.transactionAmount);
                utility.calcDisplaySummary(currentTransactions, labelSumIn, labelSumOut);
                utility.displayMovements(currentTransactions, containerMovements);
                utility.balanceAdd(labelBalance, -currTransaction.transactionAmount);
            }
        })
        .catch(error => console.log(error));
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
    inputLoanAmount.value = ``;

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
    utility.openModal(modal, overlay);
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

registrationForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (userName.value == '' || userSurname.value == '' || userUsername.value == '' || userPassword.value == '' || userMail.value == '') {
        alert('Make sure you fill all the fields!');
    } else {
        // O/w create the user object, and fill its corresponding fields
        let currUser = new classes.User();

        console.log(`userPassword ${userPassword.value}`);

        currUser.userUsername = userUsername.value;
        currUser.userPassword = Number(userPassword.value);
        currUser.userFullname = `${userName.value} ${userSurname.value}`;
        currUser.userEmail = userMail.value;

        console.log(currUser);

        // Status Code
        let statusCode;
        // Send the request
        fetch('http://localhost:8080/register', opt.registrationOptions(currUser))
            .then(response => {
                statusCode = response.status;
                return response.text();
            })
            .then(data => {
                // If the user could not be created
                console.log(statusCode);
                if (statusCode != 201) {
                    // Alert the response body so that the user know what is wrong
                    alert(data);
                    throw new Error(data);
                } else {
                    // Then we successfully created the user
                    alert('Successfully created the user!');
                    utility.closeModal(modal, overlay);
                }
                utility.clearRegistrationForm(userName, userSurname, userUsername, userPassword, userMail);
            })
            .catch(error => console.log(error));
    }
});

// The below event listeners are to close the registration modal in different ways = ESC, CLICK-ON-OVERLAY, CLOSE-BUTTON
closeModalButton.addEventListener('click', e => {
    e.preventDefault();

    utility.closeModal(modal, overlay);
});

document.addEventListener(`keydown`, function (e) {
    if (!modal.classList.contains(`hidden`) && e.key === `Escape`) {
        utility.closeModal(modal, overlay);
    }
});

overlay.addEventListener('click', e => {
    utility.closeModal(modal, overlay);
});
