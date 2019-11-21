FROM 100.69.158.196/buildtool:pm291
WORKDIR /usr/share/nginx/html/finrax-nodeJs
COPY package*.json ./
RUN npm install
RUN npm rebuild
EXPOSE 3000
COPY . .
CMD [ "pm2-runtime", "start", "app.js" ]