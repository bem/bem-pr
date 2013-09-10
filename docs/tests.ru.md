Сборка тестов
=============

- [Абстрактные знания](#--1)
- [Варианты оформления тестов](#--)
	- [Тесты, не требующие специфичного DOM-дерева](#----dom-)
	- [Тесты, требующие специфичное DOM-дерево](#---dom-)
- [Оформление файла `block.test.js`](#--blocktestjs)
- [Оформление файла `block.tests/testbundle.bemjson.js`](#--blockteststestbundlebemjsonjs)
- [Оформление элемента `i-bem__test`](#--i-bem__test)
- [Проектные настройки](#--2)
	- [Расширяем класс TestNode](#--testnode)
	- [Настраиваем сборку `_testbundle.test.js` и `_testbundle.js`](#--_testbundletestjs--_testbundlejs)
	- [Добавляем в проект модуль технологии `tests.js`](#-----testsjs)
	- [Добавляем путь до технологии `tests.js` в конфиги уровней `*.sets`](#----testsjs----sets)
	- [Указываем пути до технологий в `.bem/levels/bundles.js`](#-----bemlevelsbundlesjs)
- [Сборка и запуск тестов](#---)
- [Демонстрация](#-1)

### Абстрактные знания

Тест состоит из двух сущностей: тестовый бандл (раннер) и набор тестов.

Тестовые бандлы оформляются по полной аналогии с примерами, в папке `block.tests`.

У каждого тестового бандла может быть свой дополнительный уровень переопределения.

Наборы тестов пишутся в технологии `test.js`.

Набор тестов можно сделать для любой bem-сущности (блок, элемент и т.д.).

Для тестирования используется фреймворк [mocha](http://visionmedia.github.io/mocha/) в режиме `bdd`.

Для ассертов используется библиотека [chai](http://chaijs.com/) с плагином [sinon-chai](https://github.com/domenic/sinon-chai).
На момент запуска тестов метод `chai.should` уже выполнен (http://chaijs.com/guide/styles/).

Для моков используется библиотека [sinon](http://sinonjs.org/).

### Варианты оформления тестов

Условно можно выделить два случая:

1. Тесты, не требующие специфичного DOM-дерева, либо создающие его самостоятельно через js.
2. Тесты, требующие специфичное DOM-дерево, созданное на этапе генерации страницы.


#### Тесты, не требующие специфичного DOM-дерева

Для первого случая подходит простая схема оформления тестов:

    common.blocks/block/
    ├── __elem
    │   └── ...
    ├── block.css
    ├── block.deps.js
    ├── block.test.js
    └── block.js

Тесты пишутся в файле `block.test.js`.
В данном случае это тесты для блока, но можно точно также написать их для элемента или модификатора.
Этого достаточно, чтобы собрать дефолтный тестовый бандл, в рамках которого будут запущены тесты из этого файла.


#### Тесты, требующие специфичное DOM-дерево

Во втором случае нам требуется входное bem-дерево. Для этого по аналогии с примерами в папке блока создается директория
`block.tests`:

    common.blocks/block/
    ├── __elem
    │   ├── block__elem.css
    │   └── block__elem.title.txt
    ├── block.tests
    │   ├── testbundle.bemjson.js
    ├── block.test.js
    └── block.js

Здесь мы гораздо лучше контролируем процесс. В `testbundle.bemjson.js` можно задать bem-дерево для полноценной страницы,
указать тесты каких конкретно блоков запускать.

Для этого конкретного бандла можно задать свой дополнительный уровень переопределения:

    common.blocks/block/
    ├── __elem
    │   ├── block__elem.css
    │   └── block__elem.title.txt
    ├── block.tests
    │   ├── testbundle.bemjson.js
    │   └── testbundle.blocks
    │       └── myblock
    │           └── myblock.test.js
    ├── block.test.js
    └── block.js

**ВАЖНО!** Файл `testbundle.bemjson.js` должен интерпретироваться как блок в технологии `bemjson.js`,
поэтому в имени тестового бандла нельзя использовать нижнее подчеркивание. Используйте `-` для разделения
слов в названии.

### Оформление файла `block.test.js`

Тесты пишутся под фреймворк `mocha` с использованием библиотеки ассертов `chai`.

Для запуска тестов используется [модульная система](https://github.com/ymaps/modules).
Каждый тест декларируется под именем `test` и провайдит `undefined`.

Пример:

```js
modules.define('test', function(provide) {

    describe('block', function() {
        it('Два умножить на два должно равняться четырем', function() {
            (2*2).should.to.equal(4);
        });
    });

    provide();

});
```


### Оформление файла `block.tests/testbundle.bemjson.js`

В `testbundle.bemjson.js` пишется произвольный bemjson, плюс:
- Подключение `testbundle.test.js` (должно идти после подключения обычного js);
- Нужно задекларировать блок `test`.

Пример:

```js
({
    block: 'page',
    head: [
        { elem: 'css', url: '_testbundle.css', ie: false },
        { elem: 'js', url: '_testbundle.test.js' }
    ],
    content: [
        { block: 'test' },
        { block: 'header' },
        { block: 'content' },
        { block: 'footer' }
    ]
})
```

### Оформление блока `test`

`test` это специальный блок, который поставляется с библиотекой `bem-pr`. Он умеет запускать тесты.
Делает две простые вещи:
- Дает возможность прогнать тесты конкретных блоков;
- Подтягивает за собой тестовый фреймворк (mocha), библиотеку ассертов (chai) и пр.

Есть два способа оформления блока `test` в `testbundle.bemjson.js`.
Запустить все тесты, какие приехали по зависимостям:

```js
{ block: 'test' }
```

Запустить тесты конкретных блоков:

```js
{
    block: 'test',
    content: [
        { block: 'block' },
        { block: 'block', elem: 'elem' },
        { block: 'another-block'},
        ...
    ]
}
```

### Смена шаблона дефолтного тестового бандла

Если вам не подходит bemjson, который создаётся для дефолтного тестового бандла, вы можете заменить его,
создав свою технологию `test-tmpl`. Для этого создайте модуль технологии `.bem/techs/test-tmpl.js`, и из метода
`getTemplate()` верните подходящий шаблон.

```js
exports.baseTechPath = require.resolve('bem-pr/techs/test-tmpl.js');

exports.techMixin = {

    getTemplate: function() {
        return [
            '({',
            '    block: "b-page",',
            '    head: [',
            '        { elem: "css", url: "_{{bemBundleName}}.css", ie: false },',
            '        { elem: "css", url: "_{{bemBundleName}}.css", ie: true }',
            '    ],',
            '    content: [',
            '        {',
            '            block: "test",',
            '            content: {{bemTmplContent}}',
            '        },',
            '        { block: "i-jquery", protocol: "http", mods: { version: "1.8.3" } },',
            '        { elem: "js", url: "_{{bemBundleName}}.test.js" }',
            '    ]',
            '})'
        ];
    }

};
```

### Проектные настройки

В файле `.bem/make.js`:
- Расширяем класс `TestNode`

В файле `.bem/levels/tests.js`:
- Указываем пути до технологий `test.js+browser.js+bemhtml`, `test-tmpl`, `phantomjs`, `browser.js` и `bemhtml`.

#### Расширяем класс `TestNode`

Сначала нужно настроить сборку примеров (и убедиться, что она работает):
https://github.com/bem/bem-pr/blob/master/docs/howto.ru.md

За сборку тестовых бандлов отвечает класс `TestNode` (он расширяет класс `ExampleNode`).

Расширяем этот класс:
- Указываем технологии, в которых будет собираться тестовый бандл;
- Указываем web-адрес, который смотрит на корень проекта (опционально);
- Указываем название репортера, который будет выводить результаты тестов в консоли (опционально).

```js
MAKE.decl('TestNode', {

    getTechs : function() {

        return [
            'bemjson.js',
            'bemdecl.js',
            'deps.js',
            'bemhtml',
            'test.js+browser.js+bemhtml',
            'css',
            'html',
            'phantomjs'
        ];
    },

    webRoot: 'http://islands-page.dev/',

    consoleReporter: 'teamcity'
})
```

Выше я предполагаю, что полный набор уровней уже указан для класса `ExampleNode`.

`webRoot` должен быть таким, чтобы от него можно было отложить путь до тестового бандла:
`http://islands-page.dev/smth.sets/block.tests/test-bundle/test-bundle.html`.

`webRoot` указывается со слешом на конце. По этому адресу должен отвечать веб-сервер.

Возможные значения поля `consoleReporter` смотри в [документации к mocha-phantomjs](https://github.com/metaskills/mocha-phantomjs#supported-reporters).
По умолчанию используется репортер `spec`.


#### Указываем пути до технологий в `.bem/levels/tests.js`.

В файле `.bem/levels/tests.js` должны быть указаны пути до технологий `test.js+browser.js+bemhtml`, `test.js`,
`test-tmpl`, `phantomjs`, `browser.js`, `vanilla.js` и `bemhtml`, которые потребуются при сборке тестов.

```js
var bemPr = require('bem-pr'),
    PATH = require('path'),
    PRJ_TECHS = PATH.resolve(__dirname, '../techs'),
    PRJ_ROOT = PATH.resolve(__dirname, '../..');

exports.getTechs = function() {

    return {

        // Технологии для сборки и запуска тестов
        'test.js+browser.js+bemhtml' : bemPr.resolve('./techs/test.js+browser.js+bemhtml.js'),
        'test.js'                    : bemPr.resolve('./techs/test.js.js'),
        'test-tmpl'                  : bemPr.resolve('./techs/test-tmpl.js'),
        'phantomjs'                  : bemPr.resolve('./techs/phantomjs.js'),

        'bemhtml'                    : PATH.join(PRJ_ROOT, 'bem-core/.bem/techs/bemhtml.js'),
        'browser.js'                 : PATH.join(PRJ_ROOT, 'bem-core/.bem/techs/browser.js.js'),
        'vanilla.js'                 : PATH.join(PRJ_ROOT, 'bem-core/.bem/techs/vanilla.js.js'),

        // Технологии ниже указывать не обязательно, если вы расширяете
        // набор технологий из BundleNode или ExampleNode, и они там уже заданы
        'bemjson.js'                 : PATH.join(PRJ_TECHS, 'bemjson.js'),
        'bemdecl.js'                 : 'bemdecl.js',
        'deps.js'                    : 'deps.js',
        'js'                         : 'js-i',
        'css'                        : 'css',
        'ie.css'                     : 'ie.css'
    };

};
```

### Сборка и запуск тестов

Дефолтный тестовый бандл для отдельной БЭМ-сущности:

    $ bem make smth.tests/block.tests/default

    $ bem make smth.tests/block__elem.tests/default

Рукотворный тестовый бандл:

    $ bem make smth.tests/block.tests/testbundle

    $ bem make smth.tests/block__elem.tests/testbundle
    
Все тестовые бандлы в рамках уровня `smth.sets`:

    $ bem make smth.sets/block.tests

Если в процесс сборки тестовых бандлов была добавлена технология `phantomjs`, то в конце сборки тесты прогонятся
через `phantomjs`, вы увидите результаты их выполнения прямо в консоли.

Собранный тестовый бандл можно открыть в браузере, там тоже будут показаны результаты выполнения тестов.

### Демонстрация

    $ git clone git@github.com:bem/bem-core
    $ cd bem-core
    $ npm install
    $ npm make libs
    $ npm make sets
