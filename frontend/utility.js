`use strict`;

function displayMovements(movements, containerMovements) {
    containerMovements.innerHTML = ``;
    for (const [index, movement] of movements.entries()) {
        const type = movement > 0 ? `deposit` : `withdrawal`;

        const htmlToAdd = `<div class="movements__row">
        <div class="movements__type movements__type--${type}">${index + 1} ${type}</div>
        <div class="movements__date">4 days ago</div>
        <div class="movements__value">${movement}€</div>
    </div>`;

        containerMovements.insertAdjacentHTML(`afterbegin`, htmlToAdd);
    }
}
function calcDisplaySummary(movements, labelSumIn, labelSumOut) {
    console.log(`Movs len ${movements.length}`);
    console.log(`Movs nonneg len ${movements.filter(curr => curr >= 0).length}`);
    console.log(`Movs neg len ${movements.filter(curr => curr < 0).length}`);
    console.log();
    console.log();
    console.log();
    labelSumIn.textContent =
        movements.length == 0
            ? `${0} €`
            : movements.reduce((acc, currNum) => {
                  console.log(`currNum in labelsumIN ${currNum}`);
                  if (currNum > 0) {
                      console.log(`currNum for IN ${currNum}`);
                      acc += currNum;
                  }
                  return acc;
              }, 0) + `€`;

    labelSumOut.textContent =
        movements.length == 0
            ? `${0} €`
            : Math.abs(
                  movements.reduce((acc, currNum) => {
                      console.log(`currNum in labelsumOUT ${currNum}`);
                      if (currNum < 0) {
                          acc += currNum;
                      }
                      return acc;
                  }, 0)
              ) + `€`;
}
// Get the balance from the labelBalance, add the amount to it, and update the labelBalance
function balanceAdd(labelBalance, amount) {
    labelBalance.textContent = `You have ${Number(labelBalance.textContent.slice(9, -3)) + amount} 💶!`;
}
//  To wait some time
function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

// To close the registration modal
const closeModal = function (modal, overlay) {
    modal.classList.add(`hidden`);
    overlay.classList.add(`hidden`);
};
// To open the registration modal
const openModal = function (modal, overlay) {
    modal.classList.remove(`hidden`);
    overlay.classList.remove(`hidden`);
};

function clearRegistrationForm(userName, userSurname, userUsername, userPassword, userMail) {
    userName.value = '';
    userSurname.value = '';
    userUsername.value = '';
    userPassword.value = '';
    userMail.value = '';
}
export { displayMovements, calcDisplaySummary, balanceAdd, sleep, closeModal, openModal, clearRegistrationForm };
