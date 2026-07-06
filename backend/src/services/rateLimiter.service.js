const requests = new Map();

const WINDOW_SIZE = 60 * 1000; // 60 seconds
const MAX_REQUESTS = 5;

function isAllowed(ip) {
    const now = Date.now();

    const user = requests.get(ip);

    if (!user) {
        requests.set(ip, {
            count: 1,
            startTime: now,
        });

        return true;
    }

    const timePassed = now - user.startTime;

    if (timePassed > WINDOW_SIZE) {
        requests.set(ip, {
            count: 1,
            startTime: now,
        });

        return true;
    }

    if (user.count >= MAX_REQUESTS) {
        return false;
    }

    user.count++;

    return true;
}

module.exports = {
    isAllowed,
};