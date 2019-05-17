////
///
// Declaração das bibliotecas
const express = require('express')
const app = express()
const sqlite = require('sqlite')
const bodyParser = require('body-parser')

const path = require('path')

//Configuração para rodar no ZEIT
const port = process.env.PORT || 8080
app.listen(port)


//Checar se esta na máquina local ou no server, para não acessar o /admin
app.use('/admin', (request, response, next) =>{
    if(request.hostname === 'localhost'){
        next()
    }else{
        response.send('Não Autorizado!')
    }
})

app.set('views', path.join(__dirname, 'views'))

////
///
// Criação do Banco de Dados
const dbConnection = sqlite.open(path.resolve(__dirname, 'banco.sqlite'), { Promise })

////
///
// Esperar a conexao com o banco e criar as tabelas caso não existam
const init = async() =>{
    const db = await dbConnection
    await db.run('create table if not exists tblcategorias(id INTEGER PRIMARY KEY, categoria TEXT);')
    await db.run('create table if not exists tblvagas(id INTEGER PRIMARY KEY, categoria INTEGER, titulo TEXT, descricao TEXT);')
}
init()

////
///
//Indicando que o EJS vai ser o responsável pela parte das views
app.set('view engine', 'ejs')

////
///
// Indicando que os nossos arquivos estaticos estão na pasta public
//app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(__dirname + '/public'))

// Indicando que toda a requisição que passar vai ser o bodyParser
app.use(bodyParser.urlencoded({extended: true}))

//////
///
// Home Page, página Raiz
app.get('/', async(request, response) =>{
    const db = await dbConnection
    const categoriasDb = await db.all('select * from tblcategorias;')
    const vagas = await db.all('select * from tblvagas;')
    const categorias = categoriasDb.map(cat => {
        return{
            ...cat,
            vagas: vagas.filter( vaga => vaga.categoria === cat.id)
        }
    })
    response.render('home',{
         categorias
     })
})

////
///
//Declarando a rota de vaga
 app.get('/vaga/:id', async(request, response) =>{
    const db = await dbConnection
    const vaga = await db.get('select * from tblvagas where id = '+request.params.id)
    response.render('vaga',{
        vaga
    })
})

//Declarando a rota da página de Admin
app.get('/admin', (request, response) =>{
    response.render('admin/home')
})

//Declarando a rota para gerenciamento das Vagas
app.get('/admin/vagas', async(request, response) => {
    const db = await dbConnection
    const vagas = await db.all('select * from tblvagas;')
    response.render('admin/vagas' , { vagas })
})

//Declarando a rota para excluir as Vagas
app.get('/admin/vagas/delete/:id', async (request, response) => {
    const db = await dbConnection
    await db.run('delete from tblvagas where id = '+request.params.id+'')
    response.redirect('/admin/vagas')
})
 
//Declarando a rota para criação de novas Vagas
app.get('/admin/vagas/nova', async(request, response) =>{
    const db = await dbConnection
    const categorias = await db.all('select * from tblcategorias')
    response.render('admin/nova-vaga', { categorias })
})

//Vamos criar o POST para que quando alguém envie os dados
app.post('/admin/vagas/nova', async(request, response) =>{
    const { titulo, descricao, categoria } = request.body
    const db = await dbConnection
    await db.run(`insert into tblvagas(categoria, titulo, descricao) values (${categoria}, '${titulo}', '${descricao}')`)    
    response.redirect('/admin/vagas')
})

//Declarando a rota para editar as Vagas
app.get('/admin/vagas/editar/:id', async(request, response) =>{
    const db = await dbConnection
    const categorias = await db.all('select * from tblcategorias')
    const vaga = await db.get('select * from tblvagas where id = '+request.params.id)
    response.render('admin/editar-vaga', { categorias, vaga })
})

//Criando o POST para editar as vagas
app.post('/admin/vagas/editar/:id', async(request, response) =>{
    const { titulo, descricao, categoria } = request.body
    const id = request.params.id
    const db = await dbConnection
    await db.run(`update tblvagas set categoria= ${categoria}, titulo= '${titulo}', descricao= '${descricao}' where id = ${id}`)    
    response.redirect('/admin/vagas')
})

////
///
// Declaração da Rota de Categorias
app.get('/categoria/categorias:id', async(request, response) =>{
    const db = await dbConnection
    const categoria = await db.get('select * from tblcategorias where id = '+request.params.id)
    response.render('categoria',{
        categoria
    })
})
//Declarando a rota para gerenciamento das Categorias
app.get('/admin/categoria/categorias', async(request, response) => {
    const db = await dbConnection
    const categoria = await db.all('select * from tblcategorias;')
    response.render('admin/categoria/categorias' , { categoria })
})

//Declarando a rota para excluir as Categorias
app.get('/admin/categoria/categorias/delete/:id', async (request, response) => {
    const db = await dbConnection
    await db.run('delete from tblcategorias where id = '+request.params.id+'')
    response.redirect('/admin/categoria/categorias')
})

//Declarando a rota para criação de novas Categorias
app.get('/admin/categoria/nova-categoria', async(request, response) =>{
    const db = await dbConnection
    const categorias = await db.all('select * from tblcategorias')
    response.render('admin/categoria/nova-categoria', { categorias })
})

//Vamos criar o POST para que quando alguém envie os dados
app.post('/admin/categoria/nova-categoria', async(request, response) =>{
    const { categoria } = request.body
    const db = await dbConnection
    await db.run(`insert into tblcategorias(categoria) values ('${categoria}')`)    
    response.redirect('/admin/categoria/categorias')
})

//Declarando a rota para editar as Categorias
app.get('/admin/categoria/editar-categoria/:id', async(request, response) =>{
    const db = await dbConnection
    const categoria = await db.get('select * from tblcategorias where id ='+request.params.id)
    response.render('admin/categoria/editar-categoria', { categoria })
})

//Criando o POST para editar as Categorias
app.post('/admin/categoria/editar-categoria/:id', async(request, response) =>{
    const { categoria } = request.body
    const id = request.params.id
    const db = await dbConnection
    await db.run(`update tblcategorias set categoria= '${categoria}' where id = ${id}`)    
    response.redirect('/admin/categoria/categorias')
})