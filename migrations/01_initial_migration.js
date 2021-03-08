const Migrations = artifacts.require("Migrations");

module.exports = async () => {
    const migration = await Migrations.new();
    Migrations.setAsDeployed(migration);
    console.log("ran setAsDeployed")
};
