COPY anti-script/ .

COPY anti-script/start.sh ./start.sh
RUN chmod +x ./start.sh

RUN chmod +x ./node_modules/.bin/tsc
RUN npm run build

EXPOSE 3030

CMD ["./start.sh"]
