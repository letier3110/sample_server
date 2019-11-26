const express = require('express')
const bodyParser = require('body-parser')
const path = require(`path`)
const morgan = require('morgan')
const http = require('http')
const app = express()

const sse = require('./sse')
// [START enable_parser]
// app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json())
app.use(morgan())
app.use('/static', express.static(__dirname + '/public/static'))
app.use('/', express.static(__dirname + '/public'))
app.use('/event/*/user/*', express.static(__dirname + '/public'))
app.use('/event/*', express.static(__dirname + '/public'))
// [END enable_parser]
// [START add_display_form]
app.get('/api/submit', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/form.html'))
})
// [END add_display_form]

// [START add_post_handler]
app.post('/api/event/participants', (req, res) => {
  // add new participant
  const obj = {
    slug: req.body.slug,
    user: req.body.user
  }
  console.log(obj)
  addNewParticipant(obj)
  res.send('Thanks for your message!')
})

app.patch('/api/event/participants', (req, res) => {
  // add new scores
  // const obj = {
  //   slug: req.body.slug,
  //   dateEnd: req.body.dateEnd,
  //   name: req.body.name
  // }
  // console.log(obj)
  // addNewEvent(obj)
  // res.send('Thanks for your message!')
})

app.post('/api/event', (req, res) => {
  const obj = {
    dateStart: req.body.dateStart,
    dateEnd: req.body.dateEnd,
    name: req.body.name
  }
  console.log(obj)
  addNewEvent(obj)
  res.send('Thanks for your message!')
})

app.patch('/api/event', (req, res) => {
  const obj = {
    routes: req.body.routes,
    slug: req.body.slug
  }
  console.log(obj)
  patchEvent(obj)
  res.send('Thanks for your message!')
})

app.get('/api/event', (req, res) => {
  getEventController(res)
})

app.post('/api/user', (req, res) => {
  const obj = {
    district: req.body.district,
    organization: req.body.organization,
    gender: req.body.gender,
    groupAge: req.body.groupAge,
    name: req.body.name
  }
  console.log(obj)
  addNewUser(obj, res)
})

app.get('/api/user', (req, res) => {
  getUserController(res)
})

app.post('/api/route', (req, res) => {
  const obj = {
    maxScore: parseInt(req.body.maxScore),
    name: req.body.name
  }
  console.log(obj)
  addNewRoute(obj)
  res.send('Thanks for your message!')
})

app.get('/api/route', (req, res) => {
  getRouteController(res)
})

app.post('/api/age', (req, res) => {
  const obj = {
    age: req.body.age
  }
  console.log(obj)
  addNewAge(obj)
  res.send('Thanks for your message!')
})

app.get('/api/age', (req, res) => {
  getAgeController(res)
})

app.post('/api/district', (req, res) => {
  const obj = {
    name: req.body.name
  }
  console.log(obj)
  addNewDistrict(obj)
  res.send('Thanks for your message!')
})

app.get('/api/district', (req, res) => {
  getDistrictController(res)
})

app.post('/api/organization', (req, res) => {
  const obj = {
    name: req.body.name
  }
  console.log(obj)
  addNewOrganization(obj)
  res.send('Thanks for your message!')
})

app.get('/api/organization', (req, res) => {
  getOrganizationController(res)
})

app.get('/sse/channel', (req, res) => {
  console.log('channel')
  req.socket.setNoDelay(true)
  req.socket.setKeepAlive(true)
  req.socket.setTimeout(0)
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('X-Accel-Buffering', 'no')
  if (req.httpVersion !== '2.0') {
    res.setHeader('Connection', 'keep-alive')
  }
  res.write(':ok\n\n') // дебаг - делает стрим доступным сразу в девтулсах

  const ping = setInterval(() => {
    res.write('\n\n')
  }, 45 * 1000)
  console.log('channel2')
  const samplePush = (event, data) => {
    console.log('channel push')
    res.write('event: ' + String(event) + '\n' + 'data: ' + JSON.stringify(data) + '\n\n')
  }

  sse.on('sample_event', samplePush)

  req.on('close', () => {
    console.log('channel close')
    sse.removeListener('sample_event', samplePush)
    clearInterval(ping)
    res.end()
  })
})

// app.post('/api/participant', (req, res) => {
//   postParticipantsController(req, res)
// })

// app.patch('/api/participant', (req, res) => {
//   patchParticipantsController(req, res)
// })
// [END add_post_handler]

const PORT = process.env.PORT || 8080
app.set('port', PORT)
const server = http.createServer(app)
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`)
})

const { Firestore } = require('@google-cloud/firestore')

// Create a new client
const firestore = new Firestore({
  projectId: 'skalodromio'
})

// async function quickstart() {
//   // Obtain a document reference.
//   const document = firestore.doc('posts/intro-to-firestore')

//   // Enter new data into the document.
//   await document.set({
//     title: 'Welcome to Firestore',
//     body: 'Hello World'
//   })
//   console.log('Entered new data into the document')

//   // Update an existing document.
//   await document.update({
//     body: 'My first Firestore app'
//   })
//   console.log('Updated an existing document')

//   // Read the document.
//   let doc = await document.get()
//   console.log('Read the document', doc)

//   // Delete the document.
//   // await document.delete()
//   // console.log('Deleted the document')
// }

// actual services

async function addNewParticipant(eventData) {
  // const document = firestore.doc('events')
  let query = firestore.collection('events').where('slug', '==', eventData.slug)
  query.get().then(querySnapshot => {
    querySnapshot.forEach(documentSnapshot => {
      // console.log(`Found document at ${documentSnapshot.ref.path}`)
      const documentRef = firestore.doc(documentSnapshot.ref.path)
      documentRef.get().then(documentSnapshot => {
        let rawdata = documentSnapshot.data()
        // console.log(`Retrieved data: ${JSON.stringify(data)}`)
        const data = JSON.stringify(rawdata)
        console.log('new participants:', rawdata.participants, eventData.user)
        documentRef.update({
          participants: [...rawdata.participants.filter(e => e.slug !== eventData.user.slug), eventData.user]
        })
        sse.emit('sample_event', 'add_new_participant', { user: eventData.user, eventId: eventData.slug })
      })
    })
  })

  // const allEvents = await getEvents()
  // let events = firestore.collection('events')

  // events
  //   .add({
  //     name: eventData.name,
  //     dateStart: eventData.dateStart,
  //     dateEnd: eventData.dateEnd,
  //     slug: `${allEvents.length + 1}`,
  //     routes: [],
  //     participants: []
  //   })
  //   .then(documentReference => {
  //     let firestore = documentReference.firestore
  //     console.log(`Root location for document is ${firestore.formattedName}`)
  //   })
}

async function addNewEvent(eventData) {
  // const document = firestore.doc('events')
  const allEvents = await getEvents()
  let events = firestore.collection('events')

  events
    .add({
      name: eventData.name,
      dateStart: eventData.dateStart,
      dateEnd: eventData.dateEnd,
      slug: `${allEvents.length + 1}`,
      routes: [],
      participants: []
    })
    .then(documentReference => {
      let firestore = documentReference.firestore
      console.log(`Root location for document is ${firestore.formattedName}`)
    })
}

async function patchEvent(eventData) {
  // const document = firestore.doc('events')
  let query = firestore.collection('events').where('slug', '==', eventData.slug)
  query.get().then(querySnapshot => {
    querySnapshot.forEach(documentSnapshot => {
      // console.log(`Found document at ${documentSnapshot.ref.path}`)
      const documentRef = firestore.doc(documentSnapshot.ref.path)
      documentRef.update({
        routes: eventData.routes
      })
    })
  })
  // console.log(eventDoc)
  // eventDoc.update({
  //   routes: eventData.routes
  // })
}

async function addNewUser(userData, res) {
  const allUsers = await getUsers()
  let users = firestore.collection('users')

  const user = {
    name: userData.name,
    groupAge: userData.groupAge,
    district: userData.district,
    organization: userData.organization,
    gender: userData.gender,
    slug: `${allUsers.length + 1}`,
    scores: []
  }

  users.add(user).then(documentReference => {
    let firestore = documentReference.firestore
    console.log(`Root location for document is ${firestore.formattedName}`)
    res.send(user.slug)
    sse.emit('sample_event', 'add_new_user', user)
  })
}

async function addNewRoute(routeData) {
  // const document = firestore.doc('events')
  const allRoutes = await getRoutes()
  let routes = firestore.collection('routes')

  routes
    .add({
      name: routeData.name,
      maxScore: parseInt(routeData.maxScore),
      slug: `${allRoutes.length + 1}`,
      sector: '0'
    })
    .then(documentReference => {
      let firestore = documentReference.firestore
      console.log(`Root location for document is ${firestore.formattedName}`)
    })
}

async function addNewAge(ageData) {
  // const document = firestore.doc('events')
  const allAges = await getAges()
  let ages = firestore.collection('ages')

  ages
    .add({
      age: ageData.age,
      slug: `${allAges.length + 1}`
    })
    .then(documentReference => {
      let firestore = documentReference.firestore
      console.log(`Root location for document is ${firestore.formattedName}`)
    })
}

async function addNewDistrict(districtData) {
  // const document = firestore.doc('events')
  const allDistricts = await getDistricts()
  let districts = firestore.collection('districts')

  districts
    .add({
      name: districtData.name,
      slug: `${allDistricts.length + 1}`
    })
    .then(documentReference => {
      let firestore = documentReference.firestore
      console.log(`Root location for document is ${firestore.formattedName}`)
    })
}

async function addNewOrganization(organizationData) {
  // const document = firestore.doc('events')
  const allOrganizations = await getOrganizations()
  let organizations = firestore.collection('organizations')

  organizations
    .add({
      name: organizationData.name,
      slug: `${allOrganizations.length + 1}`
    })
    .then(documentReference => {
      let firestore = documentReference.firestore
      console.log(`Root location for document is ${firestore.formattedName}`)
    })
}

// getters helpers

async function getEvents() {
  let query = firestore.collection('events') //.where('foo', '==', 'bar')

  const docs = await query.get().then(querySnapshot => {
    return querySnapshot.docs
  })
  return docs
}

async function getUsers() {
  let query = firestore.collection('users') //.where('foo', '==', 'bar')

  const docs = await query.get().then(querySnapshot => {
    return querySnapshot.docs
  })
  return docs
}

async function getRoutes() {
  let query = firestore.collection('routes') //.where('foo', '==', 'bar')

  const docs = await query.get().then(querySnapshot => {
    return querySnapshot.docs
  })
  return docs
}

async function getAges() {
  let query = firestore.collection('ages') //.where('foo', '==', 'bar')

  const docs = await query.get().then(querySnapshot => {
    return querySnapshot.docs
  })
  return docs
}

async function getDistricts() {
  let query = firestore.collection('districts') //.where('foo', '==', 'bar')

  const docs = await query.get().then(querySnapshot => {
    return querySnapshot.docs
  })
  return docs
}

async function getOrganizations() {
  let query = firestore.collection('organizations') //.where('foo', '==', 'bar')

  const docs = await query.get().then(querySnapshot => {
    return querySnapshot.docs
  })
  return docs
}

// controlers

async function getEventController(res) {
  const objs = await getEvents()
  const retObj = objs.map(obj => {
    const field = obj._fieldsProto
    return {
      participants: field.participants.arrayValue.values.map(e => {
        const fields = e.mapValue.fields
        console.log(fields.slug)
        return {
          slug: fields.slug[fields.slug.valueType],
          scores: fields.scores.arrayValue.values.map(v => {
            // console.log(v)
            const fields2 = v.mapValue.fields
            return {
              attempt: parseInt(fields2.attempt.integerValue),
              routeSlug: fields2.routeSlug.stringValue,
              score: parseInt(fields2.score.integerValue)
            }
          })
        }
      }),
      slug: field.slug.stringValue,
      name: field.name.stringValue,
      dateStart: field.dateStart.stringValue,
      dateEnd: field.dateEnd.stringValue,
      routes: field.routes.arrayValue.values.map(e => e.stringValue)
    }
  })
  console.log(retObj)
  res.send(retObj)
}

async function getUserController(res) {
  const objs = await getUsers()
  const retObj = objs.map(obj => {
    const field = obj._fieldsProto
    return {
      slug: field.slug.stringValue,
      name: field.name.stringValue,
      groupAge: field.groupAge.stringValue,
      district: field.district.stringValue,
      organization: field.organization.stringValue,
      gender: field.gender.stringValue,
      scores: []
    }
  })
  console.log(retObj)
  res.send(retObj)
}

async function getRouteController(res) {
  const objs = await getRoutes()
  const retObj = objs.map(obj => {
    const field = obj._fieldsProto
    return {
      slug: field.slug.stringValue,
      name: field.name.stringValue,
      maxScore: parseInt(field.maxScore[field.maxScore.valueType]), //integerValue
      sector: '0'
    }
  })
  console.log(retObj)
  res.send(retObj)
}

async function getAgeController(res) {
  const objs = await getAges()
  const retObj = objs.map(obj => {
    const field = obj._fieldsProto
    return {
      slug: field.slug.stringValue,
      age: field.age.stringValue
    }
  })
  console.log(retObj)
  res.send(retObj)
}

async function getDistrictController(res) {
  const objs = await getDistricts()
  const retObj = objs.map(obj => {
    const field = obj._fieldsProto
    return {
      slug: field.slug.stringValue,
      name: field.name.stringValue
    }
  })
  console.log(retObj)
  res.send(retObj)
}

async function getOrganizationController(res) {
  const objs = await getOrganizations()
  const retObj = objs.map(obj => {
    const field = obj._fieldsProto
    return {
      slug: field.slug.stringValue,
      name: field.name.stringValue
    }
  })
  console.log(retObj)
  res.send(retObj)
}

async function postParticipantsController(req, res) {
  const obj = {
    slug: req.body.slug,
    scores: req.body.scores
  }
  console.log(obj)
  addNewParticipant(obj)
  // res.send('Thanks for your message!')
  // const objs = await getOrganizations()
  // const retObj = objs.map(obj => {
  //   const field = obj._fieldsProto
  //   return {
  //     slug: field.slug.stringValue,
  //     name: field.name.stringValue
  //   }
  // })
  // console.log(retObj)
  res.send('retObj')
}

async function patchParticipantsController(req, res) {
  const obj = {
    name: req.body.name
  }
  console.log(obj)
  addNewOrganization(obj)
  res.send('Thanks for your message!')
  const objs = await getOrganizations()
  const retObj = objs.map(obj => {
    const field = obj._fieldsProto
    return {
      slug: field.slug.stringValue,
      name: field.name.stringValue
    }
  })
  console.log(retObj)
  res.send(retObj)
}

// export

module.exports = app
