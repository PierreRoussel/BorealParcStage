# BorealParcStage
Repo du projet stage modification du site internet pour Boreal Parc dans la période Janvier/Février 2018

# Mise en route du projet
Pour mettre en route le projet, une fois tous les éléments téléchargés, il faut lancer le serveur mongoDB. Pour cela, il faut tout d'abord synchroniser les schema et les collections de votre dataBase locale (voir mongorestore).
Ensuite lancer un invite de commande localisé dans votre dataBase locale, puis lancer la commande de démarrage du serveur (voir mongod).
Pour lancer ensuite le serveur web, il faut lancer un invite de commande dans la racine du projet, puis lancer la commande de démarrage du serveur (voir node ou plutôt nodemon).

# Système de template utilisé
Le système de template HBS (handlebars) permet la mise en place de conditions et d'helpers personnalisés sur les pages .hbs (qui remplacent les .html). 

# Le router
Le fichier router (./routes/router.js) est le fil conducteur du serveur, c'est lui qui interprète les interactions entre le site-web et la base de donnée.
