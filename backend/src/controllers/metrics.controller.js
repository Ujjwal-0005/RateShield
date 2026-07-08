const metrics = require("../services/metrics.service");

async function getMetrics(req, res) {

    const data = await metrics.getMetrics();

    res.json({
        success: true,
        data
    });

}

module.exports = {
    getMetrics
};