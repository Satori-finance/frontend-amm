FROM nginx:alpine

RUN rm /etc/nginx/conf.d/*
COPY nginx/mcdex.conf /etc/nginx/conf.d/
COPY dist /srv/http

CMD ["nginx", "-g", "daemon off;"]
