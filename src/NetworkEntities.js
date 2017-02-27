var naf = require('./NafIndex.js');

class NetworkEntities {

  constructor() {
    this.entities = {};
  }

  createNetworkEntity(template, position, rotation) {
    var networkId = this.createEntityId();
    naf.log.write('Created network entity', networkId);
    var entityData = {
      networkId: networkId,
      owner: naf.globals.clientId,
      template: template,
      position: position,
      rotation: rotation,
    };
    var entity = this.createLocalEntity(entityData);
    return entity;
  }

  createAvatar(template, position, rotation) {
    var avatar = this.createNetworkEntity(template, position, rotation);
    avatar.setAttribute('visible', false);
    avatar.setAttribute('follow-camera', '');
    avatar.className += ' local-avatar';
    avatar.removeAttribute('lerp');
    return avatar;
  }

  createLocalEntity(entityData) {
    var scene = document.querySelector('a-scene');
    var entity = document.createElement('a-entity');
    entity.setAttribute('id', 'naf-' + entityData.networkId);
    entity.setAttribute('template', 'src:' + entityData.template);
    entity.setAttribute('position', entityData.position);
    entity.setAttribute('rotation', entityData.rotation);
    entity.setAttribute('network', 'owner:' + entityData.owner + ';networkId:' + entityData.networkId);
    entity.setAttribute('lerp', '');

    scene.appendChild(entity);
    this.entities[entityData.networkId] = entity;
    return entity;
  }

  updateEntity(client, dataType, entityData) {
    var isCompressed = entityData[0] == 1;
    var networkId = isCompressed ? entityData[1] : entityData.networkId;

    if (this.hasEntity(networkId)) {
      this.entities[networkId].emit('networkUpdate', {entityData: entityData}, false);
    } else if (!isCompressed) {
      this.createLocalEntity(entityData);
    }
  }

  completeSync() {
    for (var id in this.entities) {
      if (this.entities.hasOwnProperty(id)) {
        this.entities[id].emit('syncAll', null, false);
      }
    }
  }

  removeEntity(id) {
    if (this.hasEntity(id)) {
      var entity = this.entities[id];
      delete this.entities[id];
      entity.parentNode.removeChild(entity);
      return entity;
    } else {
      return null;
    }
  }

  removeEntitiesFromUser(user) {
    var entityList = [];
    for (var id in this.entities) {
      var entityOwner = naf.util.getNetworkOwner(this.entities[id]);
      if (entityOwner == user) {
        var entity = this.removeEntity(id);
        entityList.push(entity);
      }
    }
    return entityList;
  }

  getEntity(id) {
    if (this.entities.hasOwnProperty(id)) {
      return this.entities[id];
    }
    return null;
  }

  hasEntity(id) {
    return this.entities.hasOwnProperty(id);
  }

  createEntityId() {
    return Math.random().toString(36).substring(2, 9);
  }
}

module.exports = NetworkEntities;