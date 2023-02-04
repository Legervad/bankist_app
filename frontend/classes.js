'use strict';
class User {
    constructor(userId, userUsername, userPassword, userFullname, userEmail, userBalance) {
        this.userId = userId;
        this.userUsername = userUsername;
        this.userPassword = userPassword;
        this.userFullname = userFullname;
        this.userEmail = userEmail;
        this.userBalance = userBalance;
    }
}

class Transaction {
    constructor(transactionId, userIdFrom, userIdTo, transactionAmount) {
        this.transactionId = transactionId;
        this.userIdFrom = userIdFrom;
        this.userIdTo = userIdTo;
        this.transactionAmount = transactionAmount;
    }
}

export { User, Transaction };
