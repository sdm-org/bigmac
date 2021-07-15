FROM atomist/sdm-base:0.3.0@sha256:9b1ca81847e47c4cfe02f695055f2da321a6ab2b8b7fda85131256be6e81629b as builder
 
RUN npm install --global yarn
 
RUN apt-get update && apt-get install -y \
        libfontconfig \
    && rm -rf /var/lib/apt/lists/*
 
COPY package.json package-lock.json ./

ARG NPMRC
RUN echo "$NPMRC" > .npmrc \
    && npm ci \
    && npm cache clean --force \
    && rm .npmrc

COPY . .

# Declaring a volume will instruct kaniko to skip the directory when snapshotting
VOLUME /opt/app
 
FROM ubuntu:rolling@sha256:20000a84ba67264b7f9a48f60b319a30d6898a41e1847ec809419f24fb40e634
