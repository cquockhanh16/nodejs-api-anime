const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const cheerio = require('cheerio')
const axios = require('axios')
require('dotenv').config()

const PORT = process.env.PORT || 8001
const WEB_ANIME_URL = process.env.WEB_ANIME_URL
const characterUrl = process.env.CHARACTER_URL
const app = express();

// SET UP
app.use(cors());
app.use(bodyParser.json({limit: "50mb"}))
app.use(bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000
}))


// ROUTES
app.get('/v1', (req, res, next) => {
    const thumnails = []
    const limit = Number(req.query.limit)
    try{
        axios(WEB_ANIME_URL).then(resw => {
            const html = resw.data;
            const $ = cheerio.load(html)
            $('.portal', html).each(function(){
                const name = $(this).find('a').attr('title')
                const url = $(this).find('a').attr('href')
                const image = $(this).find('a > img').attr('data-src')
                thumnails.push({
                    name: name,
                    url: "https://api-anime-ajqq.onrender.com/v1" + url.split('/wiki')[1],
                    image: image
                })
                
            })
            if(limit && limit > 0){
                return res.status(200).json(thumnails.slice(0, limit))
            }else{
                return res.status(200).json(thumnails)
            }
        })
    }catch(err) {
        res.status(500).json(err)
    }
})

app.get('/v1/:character', (req, res) => {
    const name = req.params.character;
    const urlCharacter = characterUrl + name;
    const titles = []
    const details = []
    const galleries = []
    const characters = []
    let characterObj = {}
    try{
        axios(urlCharacter).then(resp => {
            const html = resp.data;
            const $ = cheerio.load(html)
            $('.wikia-gallery-item', html).each(function(){
                const gallery = $(this).find('a > img').attr('data-src');
                galleries.push(gallery);
            })
            $('aside', html).each(function(){
                $(this).find('section > div > h3').each(function(){
                    titles.push($(this).text())
                })
                $(this).find('section > div > div').each(function(){
                    details.push($(this).text())
                })
                let image = $(this).find('a > img').attr('src')
                if(image !== undefined){
                    for (let index = 0; index < titles.length; index++) {
                        characterObj[titles[index].toLowerCase()] = details[index]
                    }
                    characters.push({
                        name: name.split('_').join(' '), ...characterObj, image: image, gallery: galleries
                    })
                }
            })
            res.status(200).json(characters)
        })
    }catch(err){
        return res.status(500).json(err)
    }
   
})

// RUN PORT
app.listen(PORT, () => {
    console.log('Server is running')
})