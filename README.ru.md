# bem-sets

Инструмент для сборки документации проектов на БЭМ. Состоит из набора узлов [bem-make(1)](http://github.com/bem/bem-tools), с помощью которых собираются примеры, тесты и документация для
наборов уровней.

## Использование

  * [Базовые настройки и сборка примеров](docs/howto.ru.md)
  * [Сборка и запуск тестов](docs/tests.ru.md)

## Синтетический пример

См. `examples/silly`

```
› git submodule init
› git submodule update
› npm install
› cd examples/silly
› ../../node_modules/.bin/bem make sets
```

## Реальный пример

Работу bem-sets с реальными данными можно увидеть в библиотеке [bem-bl](https://github.com/bem/bem-bl), куда инструмент встроен.
