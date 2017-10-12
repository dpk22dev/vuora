/**
 * Created by vinay.sahu on 10/8/17.
 */

var config = {
    mongo: {
        host: "localhost",
        port: 27017
    },
    redis: {
        host: "localhost",
        port: 6379
    },
    linkedin: {
        oauth1uri: "https://www.linkedin.com/uas/oauth2/accessToken?grant_type=authorization_code&redirect_uri={}&client_id={}&client_secret={}&code={}&state={}",
        oauth2uri: "https://api.linkedin.com/v1/people/~:(id,first-name,email-address,last-name,headline,picture-url,industry,summary,specialties,positions:(id,title,summary,start-date,end-date,is-current,company:(id,name,type,size,industry,ticker)),educations:(id,school-name,field-of-study,start-date,end-date,degree,activities,notes),associations,interests,num-recommenders,date-of-birth,publications:(id,title,publisher:(name),authors:(id,name),date,url,summary),patents:(id,title,summary,number,status:(id,name),office:(name),inventors:(id,name),date,url),languages:(id,language:(name),proficiency:(level,name)),skills:(id,skill:(name)),certifications:(id,name,authority:(name),number,start-date,end-date),courses:(id,name,number),recommendations-received:(id,recommendation-type,recommendation-text,recommender),honors-awards,three-current-positions,three-past-positions,volunteer)?format=json&oauth2_access_token={}",
        redirectionuri: "http://localhost:3000/chat/lclbk",
        clientid: "81q35viopx4tzm",
        clientsecret: "D1OhB9hOolFQrSed",
        state: "DCEeFWf45A53sdfKef424"
    },
    logger:{
        level:"debug",
        file:"app.log"
    }
};

module.exports = config;