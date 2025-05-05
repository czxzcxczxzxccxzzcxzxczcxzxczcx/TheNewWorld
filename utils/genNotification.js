const { Notification } = require('./database');

const generateUniqueNotificationId = async () => {
    let notificationId;
    let exists = true;

    while (exists) {
        notificationId = `notification-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const existingNotification = await Notification.findOne({ notificationId });
if (!existingNotification) {
            exists = false;
        }
    }
    return notificationId;
};

const createNotification = async ({
    from,
    to,
    content,
}) => {
    try {
        const notificationId = await generateUniqueNotificationId();

        const newNotification = new Notification({
            notificationId,
            from,
            to,
            content,
            sentAt: new Date(),
        });

        await newNotification.save();
        console.log('Notification created:', newNotification);
        return newNotification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

module.exports = { createNotification };