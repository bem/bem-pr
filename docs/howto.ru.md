Как использовать библиотеку
===========================

Для корректной работы библиотеки требуются

  - Node.js >= 0.8.x,
  - bem-tools >= 0.6.12

Для того чтобы собирать примеры блоков в своей библиотеки, достаточно выполнить «несколько условий».

### 1. Подключаем `bem-pr`

    › npm install --save-dev bem-pr

### 2. Создаём прототипы уровней

    › bem create level --level bem-pr/levels/sets.js .bem/levels/sets.js

### 3. Добавляем цель `sets` в процесс сборки

`bem-pr` расширяет стандартный класс `Arch`, добавляя в процесс сборки узлы отвечающие за сборку наборов (sets).

Для добавления в процесс сборки собственных узлов, в новых версиях bem-tools, в класс `Arch` добавлен метод
`createCustomNodes`.

В `make.js` необходимо определить этот метод, добавив в процесс сборки, узлы из `bem-pr`.

```js

// PRJ/.bem/make.js

var bemPr = require('bem-pr');

(function(registry) {

    // Добавляем новые узлы в реестр
    bemPr.extendMake(registry);

    registry.decl('Arch', {

        // ...

        createCustomNodes : function(common, libs, blocks) {

            return registry.getNodeClass('SetsNode')
                // создаем экземпляр узла
                .create({
                    root : this.root,
                    arch : this.arch
                })
                // расширяем процесс сборки новыми узлами из bem-pr
                .alterArch();

        }

    }

})(MAKE);
```

### 4. Настраиваем сборку примеров

Класс `SetsNode` описывает настройки для наборов уровней, они же сэты (sets). Для описания собственных наборов
необходимо определить метод `SetsNode#getSets`.

Метод возращает объект, ключи которого — это название набора, должно совпадать с уровнем переопределения в котором
будут собираться примеры (для набора `desktop` уровень должен называться `desktop.sets`), а значение — список уровней
переопределения из которых состоит набор, т.е. на котором нужно искать примеры.

```js
// PRJ/.bem/make.js

(function(registry) {

    registry.decl('SetsNode', {
        getSets : function() {
            return {
                'desktop' : ['desktop.blocks']
             };
        }
    });

})(MAKE);
```

Дополнительно можно настроить сборку примеров, описав используемые в них уровни переопределения и список технологий.
Для этого служит класс `ExampleNode`.

Класс `ExampleNode` расширяет класс `BundleNode` из стандарного набора bem-tools, и описывается теми же методами:
`getTechs`, `getLevels` и пр. Подробнее смотреть в документации к bem-tools.

Итоговый `make.js` проекта, на этом этапе, может выглядеть так:

```js
// PRJ/.bem/make.js

var PATH = require('path'),
    bemPr = require('bem-pr');

(function(registry) {

    // Добавляем новые узлы в реестр
    bemPr.extendMake(registry);

    registry.decl('Arch', {

        createCustomNodes : function(common, libs, blocks) {

            return registry.getNodeClass('SetsNode')
                // создаем экземпляр узла
                .create({
                    root : this.root,
                    arch : this.arch
                })
                // расширяем процесс сборки новыми узлами из bem-pr
                .alterArch();

        }

    });

    registry.decl('SetsNode', {
        getSets : function() {
            return {
                'desktop' : ['desktop.blocks']
             };
        }
    });

    registry.decl('ExampleNode', {

        /**
         * Технологии сборки примера
         */
        getTechs : function() {

            return [
                'bemjson.js',
                'bemdecl.js',
                'deps.js',
                'css',
                'js',
                'bemhtml',
                'html'
            ];

        },

        /**
         * Уровни переопределения используемые для сборки примера
         */
        getLevels : function() {

            return [
                'bem-bl/blocks-common',
                'bem-bl/blocks-desktop',
                'lego/blocks-common',
                'lego/blocks-desktop',
                'desktop.blocks'
            ]
            // у каждого примера может быть дополнительно свой уровень переопределения
            .concat([
                this.rootLevel
                    .getTech('blocks')
                    .getPath(this.getSourceNodePrefix())
            ])
            .map(function(p) {
                return PATH.resolve(this.root, p);
            });

        }

    });

})(MAKE);
```

**ВАЖНО!** Проверьте, что технология `sets` задекларирована в списке технологий _корневого_ конфига уровня:

```js
// PRJ/.bem/level.js

exports.baseLevelPath = require.resolve('bem/lib/levels/project');

exports.getTechs = function() {
    return BEM.util.extend(this.__base() || {}, {
        'sets' : 'level-proto'
    });
};
```

Создаем уровень наборов, в котором у нас будут собираться примеры:

    › bem make desktop.sets

Либо, если очень хочется «проявить знания утилиты bem»

    › bem create -b desktop -T sets --force

#### Лирическое отступление

Примеры это обычные страницы, которые собираются на специальном уровне `desktop.sets/<block-name>.examples/`.

По аналогии со страницами (уровень `*.bundles`), уровням `*.examples` необходим конфиг с маппингом имен технологий
и их реализаций. В общем случае, этот конфиг может совпадать с конфигом страниц.

**NOTE** Обратите внимание, что уровни `<blocks>/block/block.examples` и `<sets>/block.examples` скорее всего должны
иметь разные конфиги, поскольку у них чаще всего отличается способ именования БЭМ-сущностей.

Примеры в `<blocks>/block/block.examples` обычно складываются плоским списком (уровень `simple`):

    › tree -a <blocks>/block/block.examples

    block.examples/
      ├── .bem/
           └── level.js             // exports.baseLevelPath = require.resolve('bem/lib/levels/simple');
      ├── 10-simple.bemjson.js
      ├── 10-simple.title.txt
      ├── 20-complex.bemjson.js
      └── 20-complex.title.txt

На данный момент, bem-tools (версия 0.6.12) не умеет собирать бандлы с плоской структурой. Поэтому структура собранных
примеров должна быть как у обычной страницы (бандла):

    › tree -a <sets>
    <sets>/
      ├── .bem/level.js
      └── block.examples/
           ├── .bem/
                └── level.js        // exports.baseLevelPath = require.resolve('../../.bem/levels/bundles.js');
           ├── 10-simple/
                └── 10-simple.bemjson.js
           └── 20-comples/
                └── 10-comples.bemjson.js

где `<sets>` — уровень наборов, созданный в конце шага (3).

### Вот и всё!

Для сборки всех примеров, запускаем

    › bem make sets

Но на это может потребоваться много времени, поэтому, для сборки конкретного примера `10example`
в блоке `block`, запускаем

    › bem make desktop.sets/block.examples/10example/10example

Либо для пересборки конкретной технологии:

    › bem make desktop.sets/block.examples/10example/10example.css

А еще можно запустить `bem server` и пересобирать пример по запросу:

    › bem server

в браузере открываем (http://localhost:8080/desktop.sets/block.examples/10example/10example.html).

Пример использования можно посмотреть в репозитории (http://github.com/bem/bem-core).
