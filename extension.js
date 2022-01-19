const Main = imports.ui.main;
const Slider = imports.ui.slider;
const St = imports.gi.St;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Soup = imports.gi.Soup;
const Me = imports.misc.extensionUtils.getCurrentExtension();

let extension;

var lights = [
    "192.168.1.155:9123",
    "192.168.1.156:9123",
]

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

                let pmTemperatureSlider = new PopupMenu.PopupMenuItem('Temperature');
                this.temperatureSlider[index] = new Slider.Slider(0);
                this.temperatureSlider[index].connect('notify::value', this.temperatureSliderChanged.bind(this, index));
                this.temperatureSlider[index].accessible_name = _('Temperature');
                pmTemperatureSlider.add_child(this.temperatureSlider[index])
                this.menu.addMenuItem(pmTemperatureSlider)

                this.menu.addMenuItem( new PopupMenu.PopupSeparatorMenuItem() );
            }

        }

        brightnessSliderChanged(index) {
            const light = lights[index]
            let brightness = parseInt(this.brightnessSlider[index].value * 100)
            //let soupSyncSession = new Soup.SessionSync();
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
                //log res
                global.log(message.response_body.data)
            });
            //let responseCode = soupSession.send_message(message);
        }

        temperatureSliderChanged(index) {
            const light = lights[index]
            const minTemperature = 143;
            const maxTemperature = 319;
            const range = maxTemperature - minTemperature;
            const temperature = minTemperature + range * this.temperatureSlider[index].value

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
                //log res
                global.log(message.response_body.data)
            });
            //let responseCode = soupSession.send_message(message);
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

