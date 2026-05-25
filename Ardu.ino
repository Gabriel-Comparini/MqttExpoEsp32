#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <DHT.h>

// --- Configurações de Rede e Broker ---
const char* ssid = "";
const char* password = "";
const char* mqtt_server = "";
const char* mqtt_user = "";
const char* mqtt_pass = "";

#define LED_PIN 2
#define DHT_PIN 4
#define DHTTYPE DHT11

DHT dht(DHT_PIN, DHTTYPE);
WiFiClientSecure espClient;
PubSubClient client(espClient);

unsigned long lastMsg = 0;
char msg[50];

void setup_wifi() {
    delay(10);
    Serial.println("\nConectando Wi-Fi...");
    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println("\nWi-Fi Conectado! IP: ");
    Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* payload, unsigned int length) {
    Serial.print("Mensagem recebida [");
    Serial.print(topic);
    Serial.print("]: ");

    String message;
    for (int i = 0; i < length; i++) {
        message += (char)payload[i];
    }

    Serial.println(message);

    if (String(topic) == "casa/luz") {
        if (message == "1") {
            digitalWrite(LED_PIN, HIGH);
            Serial.println("LED Ligado");
        } else {
            digitalWrite(LED_PIN, LOW);
            Serial.println("LED Desligado");
        }
    }
}

void reconnect() {
    while (!client.connected()) {
        Serial.println("Tentando conexão MQTT...");
        String clientId = "ESP32Client-" + String(random(0xffff), HEX);

        if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
            client.subscribe("casa/luz");
        } else {
            Serial.print("Falha, rc=");
            Serial.print(client.state());
            Serial.println(" Tentando novamente em 5s");
            delay(5000);
        }
    }
}

void setup() {
    Serial.begin(115200);
    pinMode(LED_PIN, OUTPUT);
    dht.begin();

    setup_wifi();
    
    espClient.setInsecure();

    client.setServer(mqtt_server, 8883);
    client.setCallback(callback);
}

void loop() {
    if (!client.connected()) {
        reconnect();
    }

    client.loop();

    unsigned long now = millis();

    if (now - lastMsg > 5000) {
        lastMsg = now;

        float h = dht.readHumidity();
        float t = dht.readTemperature();

        if (isnan(h) || isnan(t)) {
            Serial.println("Falha ao ler o sensor DHT!");
            return;
        }

        snprintf(msg, 50, "%.2f", t);
        Serial.print("Pub Temp: ");
        Serial.println(msg);
        client.publish("casa/temp", msg);

        snprintf(msg, 50, "%.2f", h);
        Serial.print("Pub Umid: ");
        Serial.println(msg);
        client.publish("casa/umid", msg);
    }
}
