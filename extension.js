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

            let pmBrightnessSlider = new PopupMenu.PopupMenuItem('Brightness');
            this.brightnessSlider = new Slider.Slider(0);
            this._brightnessSliderChangedId = this.brightnessSlider.connect('notify::value', this.brightnessSliderChanged.bind(this));
            this.brightnessSlider.accessible_name = _('Brightness');
            pmBrightnessSlider.add_child(this.brightnessSlider)
            this.menu.addMenuItem(pmBrightnessSlider)

            let pmTemperatureSlider = new PopupMenu.PopupMenuItem('Temperature');
            this.temperatureSlider = new Slider.Slider(0);
            this._temperatureSliderChangedId = this.temperatureSlider.connect('notify::value', this.temperatureSliderChanged.bind(this));
            this.temperatureSlider.accessible_name = _('Temperature');
            pmTemperatureSlider.add_child(this.temperatureSlider)
            this.menu.addMenuItem(pmTemperatureSlider)


            this.menu.addMenuItem( new PopupMenu.PopupSeparatorMenuItem() );
        }

        brightnessSliderChanged () {
            log(this.brightnessSlider.value);
            let brightness = parseInt(this.brightnessSlider.value * 100)
            //let soupSyncSession = new Soup.SessionSync();
            let url = "http://192.168.1.156:9123/elgato/lights"
            let body = `{
                "numberOfLights": 1,
                "lights": [
                    {
                        "brightness": ${brightness}
                    }
                ]
            }`
            let message = Soup.Message.new('PUT', url);
            message.set_request('application/json', 2, body);
            this.soupSession.queue_message(message, function (_httpSession, message){
                //log res
                global.log(message.response_body.data)
            });
            //let responseCode = soupSession.send_message(message);
        }

        temperatureSliderChanged () {
            log(this.temperatureSlider.value);
            const minTemperature = 143;
            const maxTemperature = 319;
            const range = maxTemperature - minTemperature;
            const temperature = minTemperature + range * this.temperatureSlider.value

            let url = "http://192.168.1.156:9123/elgato/lights"
            let body = `{
                "numberOfLights": 1,
                "lights": [
                    {
                        "temperature": ${temperature}
                    }
                ]
            }`
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

