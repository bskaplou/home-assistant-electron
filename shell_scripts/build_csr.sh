YOUR_NAME=Nestor Mahno
YOUR_EMAIL=bskaplou@gmail.com
YOUR_COUNTRY=RU
openssl genrsa -out home_assistant.key 2048
openssl req -new -key home_assistant.key \
  -out home_assistant.csr \
  -subj "/emailAddress=$YOUR_EMAIL, CN=$YOUR_NAME, C=$YOUR_COUNTRY"

#openssl x509 -inform DER -in mac_development.cer -out certificate.crt
#openssl pkcs12 -export -out certificate.pfx -inkey home_assistant.key -in certificate.crt
#open certificate.pfx
