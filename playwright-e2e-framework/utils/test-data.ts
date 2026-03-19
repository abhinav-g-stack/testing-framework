/**
 * Centralized test data for Playwright tests.
 *
 * WHY centralized test data:
 * - When SauceDemo changes usernames/passwords, update ONE file
 * - Tests read from here instead of hardcoding credentials everywhere
 * - Makes it easy to see ALL test accounts at a glance
 *
 * SauceDemo provides several test users, each with different behaviors:
 * - standard_user: Normal behavior (happy path)
 * - locked_out_user: Always gets "locked out" error
 * - problem_user: Broken images, wrong items added to cart
 * - performance_glitch_user: Random delays on actions
 * - error_user: Triggers various JS errors
 * - visual_user: Visual changes (for visual regression testing)
 */

export const USERS = {
    standard: {
        username: 'standard_user',
        password: 'secret_sauce',
        description: 'Normal user — all features work correctly',
    },
    locked: {
        username: 'locked_out_user',
        password: 'secret_sauce',
        description: 'Always blocked at login',
    },
    problem: {
        username: 'problem_user',
        password: 'secret_sauce',
        description: 'Broken images, wrong cart items — great for testing error states',
    },
    performance: {
        username: 'performance_glitch_user',
        password: 'secret_sauce',
        description: 'Random 1-5 second delays — tests timeout handling',
    },
    error: {
        username: 'error_user',
        password: 'secret_sauce',
        description: 'Triggers JS errors — tests console error detection',
    },
    visual: {
        username: 'visual_user',
        password: 'secret_sauce',
        description: 'Subtle visual differences — for visual regression testing',
    },
};

export const PRODUCTS = {
    backpack: 'Sauce Labs Backpack',
    bikeLight: 'Sauce Labs Bike Light',
    boltTShirt: 'Sauce Labs Bolt T-Shirt',
    fleeceJacket: 'Sauce Labs Fleece Jacket',
    onesie: 'Sauce Labs Onesie',
    allTheThings: 'Test.allTheThings() T-Shirt (Red)',
};

export const CHECKOUT_INFO = {
    valid: {
        firstName: 'Abhinav',
        lastName: 'Gautam',
        postalCode: '10001',
    },
    invalid: {
        missingFirst: { firstName: '', lastName: 'Gautam', postalCode: '10001' },
        missingLast: { firstName: 'Abhinav', lastName: '', postalCode: '10001' },
        missingPostal: { firstName: 'Abhinav', lastName: 'Gautam', postalCode: '' },
    },
};
