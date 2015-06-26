var http = require('http');
var log = require('refurbish-notifier-logger')('http-server');
var logGrabber = require('refurbish-notifier-logger')('grabber');
var pager = require('refurbish-notifier-pager');
var Parser = require('refurbish-notifier-parser');
var path  = require('path');
var Routing = require('refurbish-notifier-router');
var store = require('refurbish-notifier-store');
var SERVER_PORT = 3000 || process.env.PORT;

//Определяем переменные
var staticFld = path.normalize(__dirname + '/public');
var route = new Routing();

// Создаем сервер статики для модуля
route.createStatic(staticFld, {});

// Определяем пути для статики
route.static('/css/.*', staticFld);
route.static('/js/.*', staticFld);
route.static('/lib/.*', staticFld);
route.static('/source/.*', staticFld);

// Index page
route.get('/', function(req, res){
	var html = pager({
		name: 'index',
		data: {
			items: store.data
		}
	});
	res.end(html.html);
});

// Index page
route.get('/_s/send-email', function(req, res){
	var mailer = require('refurbish-notifier-mail');
	var html = pager({
		name: 'index',
		data: {
			items: store.data
		}
	});

	mailer(html.html);

	res.end('Email sended!');
});

// Запускаем сервер HTTP или HTTPS в зависимости от настроект
var routerFunction = route.getRouter();
var nSrv = http.createServer(function(req, res) {
	log.info('GET %s', req.url);
	routerFunction(req, res);
});

// Отлавливаем ошибки
nSrv.addListener('error', function(err) {
	log.error('HTTP server :: %s', err.message);
});

// Запускаем сервер
nSrv.listen(SERVER_PORT, function(){
	log.info('HTTP server start on port %s', SERVER_PORT);
});




// Создаем объект граббера
var grabber = new Parser({
	url: 'http://store.apple.com/us/browse/home/specialdeals/mac/macbook_pro/13'
});

setInterval(function() {
	// Забираем данные с удаленной страницы
	grabber.parse()
	// Когда данные получены, рендерим страницу
	.then(function(items) {
		if (store.notEqual(items)) {
			logGrabber.info('New data avaible');
		} else {
			logGrabber.info('Sadness, things still');
		}
	})
	// Если чтото пошло не так
	.fail(function(e) {
		logGrabber.error(e);
	});
}, 24*60*60*1000);
