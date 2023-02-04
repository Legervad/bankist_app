'use strict';
const loginOptions = requestUser => {
    return {
        method: 'POST',
        url: 'http://localhost:8080/login',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestUser),
    };
};

const homeOptions = requestUser => {
    return {
        method: 'POST',
        url: 'http://localhost:8080/home',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestUser),
    };
};

const loanOptions = currTransaction => {
    return {
        method: 'POST',
        url: 'http://localhost:8080/loan',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(currTransaction),
    };
};

const transactionOptions = currTransaction => {
    return {
        method: 'POST',
        url: 'http://localhost:8080/transaction',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(currTransaction),
    };
};

export { loginOptions, homeOptions, loanOptions, transactionOptions };
