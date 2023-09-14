const {Router} = require('express')
const geo = require('../geo.json')

module.exports = app => {
  const router = new Router()

  router.get('/bal/:balId/voies/:idVoie', (req, res) => {
    app.render(req, res, '/bal/voie', {
      ...req.query,
      balId: req.params.balId,
      idVoie: req.params.idVoie
    })
  })

  router.get('/bal/:balId/toponymes/:idToponyme', (req, res) => {
    app.render(req, res, '/bal/toponyme', {
      ...req.query,
      balId: req.params.balId,
      idToponyme: req.params.idToponyme
    })
  })

  router.get('/bal/:balId/:token', (req, res) => {
    app.render(req, res, '/bal', {
      ...req.query,
      balId: req.params.balId,
      token: req.params.token
    })
  })

  router.get('/bal/:balId', (req, res) => {
    app.render(req, res, '/bal', {
      ...req.query,
      balId: req.params.balId
    })
  })

  // Redirection des URL modifiées depuis le passage en mono-commmune
  router.get('/bal/:balId/communes/:codeCommune/voies/:idVoie', (req, res) => {
    const {balId, idVoie} = req.params
    res.redirect(`/bal/${balId}/voies/${idVoie}`)
  })

  router.get('/bal/:balId/communes/:codeCommune/toponymes/:idToponyme', (req, res) => {
    const {balId, idToponyme} = req.params
    res.redirect(`/bal/${balId}/toponymes/${idToponyme}`)
  })

  router.get('/bal/:balId/communes/:codeCommune', (req, res) => {
    res.redirect(`/bal/${req.params.balId}`)
  })

  router.get('/geo/:location', (req, res) => {
    const {location} = req.params

    if (!(location in geo)) {
      return res.sendStatus(404)
    }

    return res.send(geo[location])
  })

  return router
}
