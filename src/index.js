const path = require("path")
const express = require("express")
const { dirname } = require("path")
const app = express()
const PORT = 3000 || process.env.PORT

const publicDirectory = path.join(__dirname , "../public")

app.use(express.static(publicDirectory))

app.listen(PORT , () => {
    console.log(`Server is up on port ${PORT}`)
})