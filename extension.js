const Main = imports.ui.main;
const Slider = imports.ui.slider;
const St = imports.gi.St;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Soup = imports.gi.Soup;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Mainloop = imports.mainloop;

let extension;

const lights = [
    "192.168.1.155:9123",
    "192.168.1.156:9123",
]

let throttlePause;

const throttle = (callback, time) => {
    if (throttlePause) return;

    throttlePause = true;

    Mainloop.timeout_add(time, () => {
        callback();

        throttlePause = false;
    })
}

const ElGatoKeyLightAirExtension = GObject.registerClass(
    class MyPopup extends PanelMenu.Button {

        _init () {
            super._init(0);

            this.soupSession = new Soup.Session();
            let icon = new St.Icon({
                //icon_name : 'security-low-symbolic',
                gicon : Gio.icon_new_for_string( Me.dir.get_path() + '/icon.svg' ),
                style_class : 'system-status-icon',
            });

            this.add_child(icon);

            this.brightnessSlider = [];
            this.temperatureSlider = [];
            
           for (let index in lights) {
               let pmBrightnessSlider = new PopupMenu.PopupMenuItem('Brightness');
               this.brightnessSlider[index] = new Slider.Slider(0);
               this.brightnessSlider[index].connect('notify::value', this.brightnessSliderChanged.bind(this, index));
               this.brightnessSlider[index].accessible_name = _('Brightness');
               pmBrightnessSlider.add_child(this.brightnessSlider[index])
               this.menu.addMenuItem(pmBrightnessSlider)

               this.setCurrentBrightnessSlider(index)

               let pmTemperatureSlider = new PopupMenu.PopupMenuItem('Temperature');
               this.temperatureSlider[index] = new Slider.Slider(0);
               this.temperatureSlider[index].connect('notify::value', this.temperatureSliderChanged.bind(this, index));
               this.temperatureSlider[index].accessible_name = _('Temperature');
               pmTemperatureSlider.add_child(this.temperatureSlider[index])
               this.menu.addMenuItem(pmTemperatureSlider)

               this.setCurrentTemperatureSlider(index)

               this.menu.addMenuItem( new PopupMenu.PopupSeparatorMenuItem() );
            }

        }

        brightnessSliderChanged(index) {
            const light = lights[index]
            let brightness = parseInt(this.brightnessSlider[index].value * 100)
            throttle(this.changeBrightness.bind(this, light, brightness), 100)
        }

        changeBrightness(light, brightness) {
            let url = `http://${light}/elgato/lights`
            let body = `{
                "numberOfLights": 1,
                "lights": [
                    {
                        "brightness": ${brightness}
                    }
                ]
            }`
            log(url)
            log(body)
            let message = Soup.Message.new('PUT', url);
            message.set_request('application/json', 2, body);
            this.soupSession.queue_message(message, function (_httpSession, message){
                global.log(message.response_body.data)
            });
        }

        setCurrentBrightnessSlider(index) {
            const light = lights[index]
            let url = `http://${light}/elgato/lights`
            let message = Soup.Message.new('GET', url);

            const self = this;
            this.soupSession.queue_message(message, function (_httpSession, message){
                global.log(message.response_body.data)
                const response = JSON.parse(message.response_body.data)
                const currentBrightness = response.lights[0].brightness
                self.brightnessSlider[index].value = currentBrightness / 100
            });
        }

        temperatureSliderChanged(index) {
            const light = lights[index]
            const minTemperature = 143;
            const maxTemperature = 319;
            const range = maxTemperature - minTemperature;
            const temperature = minTemperature + range * this.temperatureSlider[index].value
            throttle(this.changeTemperature.bind(this, light, temperature), 100)
        }

        changeTemperature(light, temperature) {
            let url = `http://${light}/elgato/lights`
            let body = `{
                "numberOfLights": 1,
                "lights": [
                    {
                        "temperature": ${temperature}
                    }
                ]
            }`
            log(url)
            log(body)
            let message = Soup.Message.new('PUT', url);
            message.set_request('application/json', 2, body);
            this.soupSession.queue_message(message, function (_httpSession, message){
                global.log(message.response_body.data)
            });
        }

        setCurrentTemperatureSlider(index) {
            const light = lights[index]
            let url = `http://${light}/elgato/lights`
            let message = Soup.Message.new('GET', url);

            const self = this;
            this.soupSession.queue_message(message, function (_httpSession, message){
                global.log(message.response_body.data)
                const response = JSON.parse(message.response_body.data)
                const currentTemperature = response.lights[0].temperature
                const minTemperature = 143;
                const maxTemperature = 319;
                const range = maxTemperature - minTemperature;
                self.temperatureSlider[index].value = (currentTemperature - minTemperature) / range
            });
        }

    });

function init() {
}

function enable() {
    extension = new ElGatoKeyLightAirExtension();
    Main.panel.addToStatusArea('extension', extension, 1);
}

function disable() {
    extension.destroy();
}

