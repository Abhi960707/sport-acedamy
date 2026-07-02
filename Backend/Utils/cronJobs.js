const cron = require('node-cron');
const players = require('../Model/players');
const { sendFeeReminderEmail } = require('./email');

const initCronJobs = () => {
    // Run every day at 10:00 AM
    cron.schedule('0 10 * * *', async () => {
        console.log('Running daily fee reminder job...');
        try {
            const allPlayers = await players.find();
            for (let player of allPlayers) {
                const pending = parseFloat(player.pendingFee);
                if (!isNaN(pending) && pending > 0) {
                    await sendFeeReminderEmail(player.email, player.fullName, player.pendingFee);
                    console.log(`Reminder sent to ${player.email} for pending fee ${player.pendingFee}`);
                }
            }
        } catch (error) {
            console.error('Error in daily fee reminder job:', error);
        }
    });
};

module.exports = { initCronJobs };
