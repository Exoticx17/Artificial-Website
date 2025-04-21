const express = require('express')
const videoGameController = require('../controllers/videoGameController')


const router = express.Router()

router.post('/', videoGameController.videoGamePost)
router.get('/get/all', videoGameController.videoGameGetAll)
router.get('/get/search', videoGameController.videoGameSearch)
router.get('/get/one', videoGameController.videoGameGetOne)
router.post('/videoGameRecommend', videoGameController.videoGameRecommend)
router.put('/edit/:id', videoGameController.videoGameEdit)
router.delete('/delete/:id', videoGameController.videoGameDelete)


module.exports = router;