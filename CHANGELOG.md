# Changelog


### 2.0 (upcoming)

Overridable IOs with typed `onChange` event subscription methods:

* Add new `DigitalInputOverridable` class which allows to manually override the input value
  that is returned (also affects emitted events).
* Add new `DigitalOutputOverridable` class

### 1.2

* **breaking** – `DigitalInput` signature changed, the input mode can now be chosen
  (pullup, pulldown, or off)
* Disable video titles in VLC when starting video
