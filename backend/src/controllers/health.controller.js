const getHealth = (req, res) => {

    return res.status(200).json({
        success: true,
        message: "RateShield Backend is running",
        timestamp: new Date().toISOString()
    });

};

module.exports = {
    getHealth
};