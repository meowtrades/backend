import axios from 'axios';
import { InvestmentPlan } from '../src/models/InvestmentPlan';

const BASE_URL = 'http://localhost:8000'; // Update this with your actual server URL

// Test data
const testUserData = {
    userId: 'test-user-324', // Adding userId
    address: 'inj10l9jcspxdud6ujjy4k22nlksdree2w9mamcqep'
};

const testPlanData = {
    userId: 'test-user-123', // Adding userId to plan data as well
    amount: 100,
    userWalletAddress: 'inj10l9jcspxdud6ujjy4k22nlksdree2w9mamcqep',
    frequency: 'test_minute',
    chain: 'injective',
    riskLevel: 'no_risk'
};

export const createUser = async () => {
    try {
        console.log('Creating a new user...');
        const response = await axios.post(`${BASE_URL}/api/user`, testUserData);
        console.log('Create User Response:', response.data);
        return response.data.userId; // Return userId instead of _id
    } catch (error: any) {
        console.error('Error creating user:', error.response?.data || error.message);
        throw error;
    }
};

export const createDcaPlan = async (userId: string) => {
    try {
        console.log('Creating a new DCA plan...');
        const response = await axios.post(`${BASE_URL}/api/services/s-dca/create-plan`, {
            ...testPlanData,
            userId
        });
        console.log('Create Plan Response:', response.data);
        if (!response.data || !response.data._id) {
            throw new Error("Create plan response did not include a plan ID (_id)");
        }
        return response.data._id;
    } catch (error: any) {
        console.error('Error creating DCA plan:', error.response?.data || error.message);
        throw error;
    }
};

export const getUserPlans = async (userId: string) => {
    try {
        console.log(`Getting plans for user ${userId}...`);
        const response = await axios.get(`${BASE_URL}/api/services/s-dca/plans/${userId}`);
        console.log('User Plans Response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Error getting user plans:', error.response?.data || error.message);
        throw error;
    }
};

export const getTotalInvestment = async (userId: string) => {
    try {
        console.log(`Getting total investment for user ${userId}...`);
        const response = await axios.get(`${BASE_URL}/api/services/s-dca/total-investment/${userId}`);
        console.log('Total Investment Response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Error getting total investment:', error.response?.data || error.message);
        throw error;
    }
};

export const stopDcaPlan = async (planId: string) => {
    if (!planId) {
        console.error("Cannot stop plan: planId is missing.");
        return;
    }
    try {
        console.log(`Stopping the plan ${planId}...`);
        const response = await axios.post(`${BASE_URL}/api/services/s-dca/stop-plan/${planId}`);
        console.log('Stop Plan Response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Error stopping DCA plan:', error.response?.data || error.message);
        throw error;
    }
};

export const stopAllDcaPlans = async (userId: string) => {
    if (!userId) {
        console.error("Cannot stop plan: planId is missing.");
        return;
    }
    try {
        console.log(`Stopping all plans for user ${userId}...`);
        const response = await axios.post(`${BASE_URL}/api/services/s-dca/stop-all-plans/${userId}`);
        console.log('Stop All Plans Response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Error stopping DCA plan:', error.response?.data || error.message);
        throw error;
    }
};

export const stopAllPlansAdmin = async () => {
    try {
        console.log('Stopping all plans via admin endpoint...');
        const response = await axios.post(
            `${BASE_URL}/api/admin/stop-all-plans`,
            {},
            {
                headers: {
                    'x-admin-token': '14-E'
                }
            }
        );
        console.log('Stop All Plans Response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Error stopping all plans:', error.response?.data || error.message);
        throw error;
    }
};

export const getAllActivePlansAdmin = async () => {
    try {
        console.log('Getting all active plans via admin endpoint...');
        const response = await axios.get(
            `${BASE_URL}/api/admin/active-plans`,
            {
                headers: {
                    'x-admin-token': '14-E'
                }
            }
        );
        console.log('Active Plans Response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Error getting active plans:', error.response?.data || error.message);
        throw error;
    }
};

// Execute the test sequence
(async () => {
    let createdPlanId: string | null = null;
    let userId: string | null = null;
    try {
        console.log("--- Starting Test Sequence ---");

        // // 0. Stop All Plans (Admin)
        // await stopAllPlansAdmin();

        // await getAllActivePlansAdmin();

        // 1. Create User
        // userId = await createUser();
        // console.log(`User created with ID: ${userId}`);

        // if (!userId) {
        //     throw new Error("Failed to create user or retrieve User ID.");
        // }

        // // 2. Create Plan
        // createdPlanId = await createDcaPlan(testUserData.userId);
        // console.log(`Plan created with ID: ${createdPlanId}`);

        // if (!createdPlanId) {
        //     throw new Error("Failed to create plan or retrieve Plan ID.");
        // }

        // // 3. Get User Plans
        // await getUserPlans(testUserData.userId);

        // // 4. Get Total Investment
        // await getTotalInvestment(testUserData.userId);

        // // 5. Stop Plan
        // await stopDcaPlan(createdPlanId);

        // console.log("--- Test Sequence Completed Successfully ---");

    } catch (error) {
        console.error('--- Test Sequence Failed ---');
        // Attempt to stop the plan even if other steps failed, if we have an ID
        // if (createdPlanId) {
        //     console.log(`Attempting to stop plan ${createdPlanId} after failure...`);
        //     try {
        //         await stopDcaPlan(createdPlanId);
        //         console.log(`Plan ${createdPlanId} stopped successfully after failure.`);
        //     } catch (stopError: any) {
        //         console.error(`Failed to stop plan ${createdPlanId} after test failure:`, stopError.response?.data || stopError.message);
        //     }
        // }
        process.exit(1); // Exit with error code
    }
})();


// // Execute the test sequence
// (async () => {
//     let createdPlanId: string | null = null;
//     let userId: string | null = null;
//     try {
//         console.log("--- Starting Test Sequence ---");

//         // 1. Create User
//         userId = await createUser();
//         console.log(`User created with ID: ${userId}`);

//         if (!userId) {
//             throw new Error("Failed to create user or retrieve User ID.");
//         }

//         // 2. Create Plan
//         createdPlanId = await createDcaPlan(userId);
//         console.log(`Plan created with ID: ${createdPlanId}`);

//         if (!createdPlanId) {
//             throw new Error("Failed to create plan or retrieve Plan ID.");
//         }

//         // 3. Get User Plans
//         await getUserPlans(userId);

//         // 4. Get Total Investment
//         await getTotalInvestment(userId);

//         // 5. Stop Plan
//         await stopDcaPlan(createdPlanId);

//         console.log("--- Test Sequence Completed Successfully ---");

//     } catch (error) {
//         console.error('--- Test Sequence Failed ---');
//         // Attempt to stop the plan even if other steps failed, if we have an ID
//         if (createdPlanId) {
//             console.log(`Attempting to stop plan ${createdPlanId} after failure...`);
//             try {
//                 await stopDcaPlan(createdPlanId);
//                 console.log(`Plan ${createdPlanId} stopped successfully after failure.`);
//             } catch (stopError: any) {
//                 console.error(`Failed to stop plan ${createdPlanId} after test failure:`, stopError.response?.data || stopError.message);
//             }
//         }
//         process.exit(1); // Exit with error code
//     }
// })();