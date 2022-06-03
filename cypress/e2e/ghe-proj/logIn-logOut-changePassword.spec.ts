/// <reference types="cypress" />
// import userData from '../fixtures/account.json'

Cypress.SelectorPlayground.defaults({
    selectorPriority: ["data-test-id", "data-testid", "id", "class", "attributes"],
})

describe('log in / change password / log out', () => {
    beforeEach('load fixture', () => {
        // cy.visit(Cypress.config().baseUrl)
        cy.intercept('POST', '/api/v1/user/login').as('logInStatus')
        cy.intercept('POST', '/api/v1/user/profile').as('changePasswordStatus')
    })

    context('log in successfully and log out', () => {
        beforeEach('visit the main page', function () {
            cy.visitTheMainPage()
        })

        it('has correct username/password -> expect: log in successfully', () => {
            cy.logInAsAdmin()
            cy.wait('@logInStatus').its('response.statusCode').should('be.oneOf', [200])
            //verify url
            cy.url().should('eq', Cypress.config().baseUrl + 'admin/dashboard')
        })

        it('has correct username/password -> expect: log in successfully', () => {
            cy.logInAsAdmin()
            //verify url
            cy.url().should('eq', Cypress.config().baseUrl + 'admin/dashboard')
        })

        afterEach('log out and assert', () => {
            //log out + verify url
            cy.logOutCmd();
        })
    })


    context('log in unsuccessfully', () => {
        beforeEach('visit the main page', () => {
            cy.visitTheMainPage()
        })
        it('has wrong username -> expect: error message', () => {
            cy.logInCmd('admin123', 'admin')
            cy.wait('@logInStatus').its('response.statusCode').should('be.oneOf', [500])
            cy.get('div[role="status"]').should('contain', 'Login fail!')
        })

        it('has wrong password -> expect: error message', () => {
            cy.logInCmd('admin', 'admin123')
            cy.wait('@logInStatus').its('response.statusCode').should('be.oneOf', [500])
            cy.get('div[role="status"]').should('contain', 'Login fail!')
        })
    })

    context('user / role testing', () => {
        before('visit the main page and log in as admin', () => {
            cy.visitTheMainPage()
            cy.logInAsAdmin()
        })
        beforeEach('set up listener', () => {
            ///api/v1/user
            cy.intercept('DELETE', '/api/v1/user').as('deleteUser')
            ///api/v1/user/create
            cy.intercept('POST', '/api/v1/user/create').as('addNewUser')
            //refreshing token api/v1/user?p=0&ps=10
            cy.intercept('GET', '/api/v1/user?p=0&ps=10').as('refreshPage')
        })

        context.only('create new user', () => {
            beforeEach('set up listener', () => {
                cy.navigateTo('user')
                cy.get('a[data-test-id="addNewBtn"]').click()
            })
            it('return error if enter nothing', () => {

                cy.url().then((url) => {
                    expect(url).to.contain('/user/new')
                })
                cy.get('button[data-test-id="saveBtn"]').click()
                cy.get('input[aria-invalid="true"]').then(($el) => {
                    expect($el.length).to.eq(6)
                })
            })

            it('fill in data and create new user', () => {
                //fill in data and
                cy.addUser()
            })

            it('check for duplicate user', () => {
                // cy.navigateTo('user')
                // cy.get('a[data-test-id="addNewBtn"]').click()
                cy.url().then((url) => {
                    expect(url).to.contain('/user/new')
                })
                cy.wait('@refreshPage').then((_interception) => {
                    expect(_interception.response.statusCode).to.eq(200)
                })
                cy.addUser()
                cy.wait('@addNewUser').then((_interception) => {
                    expect(_interception.response.statusCode).to.eq(500)
                })
            })
        })
        context('change password', () => {
            beforeEach('load account fixture', () => {
                cy.visitTheMainPage()
            })
            it('change password fail/success to new password on multiple accounts', function () {
                try {
                    // const userArray = this.usersData
                    // const userArrayLength = userArray.length
                    cy.fixture('account.json').then(function (usersData) {
                        cy.log(usersData.length)
                        for (let _indx = 0; _indx < usersData.length; _indx++) {
                            const user = usersData[_indx];
                            let _id = user.userName
                            let _oldPwd = user.currentPassword
                            let _newPwd = user.newPassword
                            cy.changePasswordToNewPassword(_id, _oldPwd, _newPwd)
                        }
                    })
                } catch (_e) {
                    cy.log(_e)
                }
            })
            it('change password fail/success to old password on multiple accounts', function () {
                try {
                    // const userArray = this.usersData
                    // const userArrayLength = userArray.length
                    cy.fixture('account.json').then(function (usersData) {
                        cy.log(usersData.length)
                        for (let _indx = 0; _indx < usersData.length; _indx++) {
                            const user = usersData[_indx];
                            let _id = user.userName
                            let _oldPwd = user.currentPassword
                            let _newPwd = user.newPassword
                            cy.changePasswordToOldPassword(_id, _oldPwd, _newPwd)
                        }
                    })
                } catch (_e) {
                    cy.log(_e)
                }
            })
        })
        context.only('delete user', () => {
            it('delete user', () => {
                
                cy.fixture('newUser.json').then(function (newUser) {
                    const _name = Object.keys(newUser[0])
                    
                    for (let i = 0; i < newUser.length; i++) {
                        // cy.logInAsAdmin()
                        cy.navigateTo('project')
                        cy.navigateTo('user')
                        // cy.wait('@refreshPage').then((_interception) => {
                        //     expect(_interception.response.statusCode).to.eq(200)
                        // })
                        const _user = newUser[i];
                        cy.searchFor(_user.name)
                        cy.get('button[data-test-id="actDel"]').last().click()
                        cy.get('button').contains('OK').click()
                        cy.wait('@deleteUser').then((_interception) => {
                            expect(_interception.response.statusCode).to.eq(200)
                        })
                    }
                })
            })
        })
    })
})