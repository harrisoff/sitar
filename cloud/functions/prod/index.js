const cloud=require("wx-server-sdk"),COLLECTIONS={COMMENT:"comment",USER:"user",ARTICLE:"article",BOOK:"book",SETTING:"setting",LOG:"log",SONG:"song",ALBUM:"album",NOTICE:"notice",IMAGE_RAW:"wx_image"},SETTINGS={COMMENT_LIMIT:5},CLOUD_ENV=process.env.CLOUD_ENV,cdnPrefixes=["http://sitar-cdn-1.jjlin.online/sitar","http://sitar-cdn-2.jjlin.online"],ONE_DAY=864e5;cloud.init();const db=cloud.database({env:CLOUD_ENV}),_=db.command,$=db.command.aggregate;function login(e){return new Promise(async(t,i)=>{try{const{openId:n}=e.userInfo,o=await findUser(e,["banned"]),r=!!o&&o.banned;o||await createUser(n),t(r)}catch(e){i(e)}})}function findUser(e,t){const{openId:i}=e.userInfo;return new Promise((e,n)=>{db.collection(COLLECTIONS.USER).where({open_id:i}).field(createFieldObj(...t)).get().then(({data:t})=>{t.length?e(t[0]):e(null)}).catch(n)})}function getUserData(e){const{openId:t}=e.userInfo;return new Promise((e,i)=>{const n=(new Date).getTime()-ONE_DAY;db.collection(COLLECTIONS.USER).aggregate().match({open_id:t}).lookup({from:COLLECTIONS.NOTICE,let:{last_notice:"$last_notice"},pipeline:$.pipeline().match(_.expr($.gt(["$timestamp","$$last_notice"]))).done(),as:"notices"}).lookup({from:COLLECTIONS.COMMENT,let:{timestamp:"$timestamp"},pipeline:$.pipeline().match(_.expr($.gt(["$timestamp",n]))).done(),as:"comment_list"}).end().then(({list:i})=>{const n=i[0],{banned:o,notices:r,comment_list:a}=n;r.length&&r.sort((e,t)=>t.timestamp-e.timestamp);const c=SETTINGS.COMMENT_LIMIT-a.length;e({openId:t,banned:o,commentLimit:c<0?0:c,notice:r[0]})}).catch(i)})}function getUserCommentList(e){const{openId:t}=e.userInfo;return new Promise((e,i)=>{db.collection(COLLECTIONS.COMMENT).aggregate().match({open_id:t}).sort({timestamp:-1}).lookup({from:COLLECTIONS.ARTICLE,localField:"article_id",foreignField:"real_id",as:"article"}).end().then(({list:t})=>{const i=[];t.forEach(e=>{const t=e.article[0];e.show&&i.push({id:e._id,timestamp:e.timestamp,content:e.content,realId:e.article_id,articleId:t._id,title:t.title})}),e(i)}).catch(i)})}function getUserLikeList(e){const{openId:t}=e.userInfo;return new Promise((e,i)=>{db.collection(COLLECTIONS.USER).aggregate().match({open_id:t}).lookup({from:COLLECTIONS.ARTICLE,localField:"open_id",foreignField:"like_id",as:"like_list"}).end().then(({list:t})=>{const{like_list:i}=t[0],n=[];i.forEach(e=>{e.show&&n.push({id:e._id,realId:e.real_id,timestamp:e.timestamp,title:e.title})}),e(n)}).catch(i)})}function createUser(e){return db.collection(COLLECTIONS.USER).add({data:{open_id:e,banned:!1,first_login:(new Date).getTime(),random_song:[]}})}function updateUserInfo(e){const{userInfo:t,data:i}=e,{openId:n}=t;return db.collection(COLLECTIONS.USER).where({open_id:n}).update({data:{...i}})}function getHomepage(e){return db.collection(COLLECTIONS.ARTICLE).field(createFieldObj("_id","author","title","real_id","digest","thumb_url","carousel","top","list")).where(_.or([{carousel:!0},{top:!0},{list:!0}]).and({show:!0})).orderBy("timestamp","desc").get()}function getRandomArticle(e){return new Promise((e,t)=>{db.collection(COLLECTIONS.ARTICLE).aggregate().match({show:!0}).sample({size:1}).end().then(({list:t})=>{const{_id:i,real_id:n}=t[0];e({id:i,realId:n})}).catch(t)})}function getRandomImage(e){return new Promise((e,t)=>{db.collection(COLLECTIONS.IMAGE_RAW).aggregate().sample({size:1}).end().then(({list:t})=>{const{url:i,media_id:n}=t[0];e({url:i,media_id:n})}).catch(t)})}function getRandomSong(e){return new Promise(async(t,i)=>{try{let n=!1,o=null,r=0;const a=!0;if(!(o=await findUser(e,["_id","random_song"])))throw{errMsg:"Oops! 找不到当前用户的信息"};const c=o.random_song;(r=c.sort().pop())>(new Date).getTime()-ONE_DAY&&a&&(n=!0),n?t({latest:r}):db.collection(COLLECTIONS.SONG).aggregate().sample({size:1}).lookup({from:COLLECTIONS.ALBUM,localField:"album_id",foreignField:"_id",as:"albums"}).end().then(({list:e})=>{const n=e[0],{_id:a,albums:c,cloud_id:d,title:l}=n,s=c[0],m={_id:a,title:l,album:s.title,cover:s.cover_id,artist:s.artist,cloudId:d,cdnUrl:`${getCdnPrefix()}/${l}.mp3`};db.collection(COLLECTIONS.USER).doc(o._id).update({data:{random_song:_.push((new Date).getTime())}}).then(e=>{t({song:m,latest:r})}).catch(i)}).catch(i)}catch(e){i(e)}})}function getMenuData(e){return new Promise((e,t)=>{db.collection(COLLECTIONS.ARTICLE).aggregate().project({html:!1,text:!1}).lookup({from:COLLECTIONS.BOOK,localField:"book_id",foreignField:"_id",as:"itsBook"}).limit(999).end().then(({list:t})=>{const i=[],n=[],o=[];t.forEach(e=>{const{book_id:t,_id:r,real_id:a,like_id:c,view:d,show:l,title:s,timestamp:m,url:u,itsBook:g}=e;if(l){const e={id:r,realId:a,likeId:c,view:d,title:s,timestamp:m,url:u},t=g[0];if(t){const{_id:o,author:r,cover_id:a,intro:c,title:d,type:l}=t;if("book"===l){const t=i.find(e=>e.id===o);t?insert(t.articles,e):i.push({id:o,author:r,coverId:a,intro:c,title:d,articles:[e]})}else if("booklet"===l){const t=n.find(e=>e.id===o);t?insert(t.articles,e):n.push({id:o,title:d,articles:[e]})}}else insert(o,e)}}),e({books:i,booklets:n,others:o})}).catch(t)})}function getArticleById(e){const{id:t,if_modified_since:i}=e;return db.collection(COLLECTIONS.ARTICLE).doc(t).update({data:{view:_.inc(1)}}),new Promise((e,n)=>{db.collection(COLLECTIONS.ARTICLE).where({_id:t}).field(createFieldObj("book_id","_id","author","like_id","html","real_id","title","timestamp","url","view","last_modified","thumb_url")).get().then(t=>{const n=t.data;if(n.length){const t=n[0],{last_modified:o}=t;e(!i||o>i?t:{like_id:t.like_id,view:t.view})}else e(null)}).catch(n)})}function searchArticleByKeyword(e){const{keyword:t}=e;return db.collection(COLLECTIONS.ARTICLE).field(createFieldObj("_id","book_id","book_title","real_id","title","timestamp","url")).where({show:!0,text:db.RegExp({regexp:`.*${t}`,options:"i"})}).get()}function getArticleComments(e){const{realId:t}=e;return new Promise((e,i)=>{db.collection(COLLECTIONS.COMMENT).aggregate().match({show:!0,article_id:t}).lookup({from:COLLECTIONS.USER,localField:"open_id",foreignField:"open_id",as:"user"}).lookup({from:COLLECTIONS.ARTICLE,localField:"article_id",foreignField:"real_id",as:"article"}).sort({timestamp:-1}).end().then(({list:t})=>{e(t.map(e=>{const t=e.user[0];let i=e.article[0];return i=i.show?i:null,{id:e._id,timestamp:e.timestamp,content:e.content,replyId:e.reply_id,openId:e.open_id,banned:t&&t.banned,avatarUrl:t&&t.avatarUrl,gender:t&&t.gender,nickName:t&&t.nickName,title:i&&i.title,articleId:i&&i._id,realId:i&&i.real_id}}))}).catch(i)})}function toggleLike(e){const{id:t,userInfo:i,like:n}=e,{openId:o}=i,r={like_id:n?_.addToSet(o):_.pull(o)};return db.collection(COLLECTIONS.ARTICLE).doc(t).update({data:r})}async function addComment(e){const{userInfo:t,commentData:i}=e,{openId:n}=t,{content:o,realId:r,replyId:a}=i;let c=!0;try{await cloud.openapi.security.msgSecCheck({content:o})}catch(e){87014===e.errCode&&(c=!1)}try{return await db.collection(COLLECTIONS.COMMENT).add({data:{open_id:n,timestamp:(new Date).getTime(),show:c,is_legal:c,content:o,article_id:r,reply_id:a}}),c?{}:{errCode:87014}}catch(e){throw e}}function getVersion(e){return new Promise((e,t)=>{db.collection(COLLECTIONS.SETTING).where({setting_name:"version"}).get().then(({data:t})=>{e(t[0].version)}).catch(t)})}function uploadLogs(e){const{userInfo:t,data:i}=e;return i.forEach(e=>{e.open_id=t.openId,"error"!==e.level&&"login"!==e.type||(e.context=cloud.getWXContext())}),db.collection(COLLECTIONS.LOG).add({data:i})}function getNoticeList(e){const{openId:t}=e.userInfo;return new Promise((e,i)=>{db.collection(COLLECTIONS.NOTICE).orderBy("timestamp","desc").get().then(({data:n})=>{db.collection(COLLECTIONS.USER).where({open_id:t}).update({data:{last_notice:(new Date).getTime()}}).then(t=>{e(n)}).catch(i)}).catch(i)})}function createFieldObj(...e){const t={};return e.forEach(e=>{t[e]=!0}),t}function getCdnPrefix(){return Math.random()>.5?cdnPrefixes[0]:cdnPrefixes[1]}function insert(e,t){if(0===e.length)return e.push(t);for(let i=0;i<e.length;i+=1){if(t.timestamp<=e[i].timestamp){e.splice(i,0,t);break}if(i===e.length-1){e.push(t);break}}}exports.main=((e,t)=>{switch(e.fn){case"login":return login(e);case"getUserData":return getUserData(e);case"getUserCommentList":return getUserCommentList(e);case"getUserLikeList":return getUserLikeList(e);case"toggleLike":return toggleLike(e);case"getArticleComments":return getArticleComments(e);case"searchArticleByKeyword":return searchArticleByKeyword(e);case"getHomepage":return getHomepage(e);case"getMenuData":return getMenuData(e);case"getRandomArticle":return getRandomArticle(e);case"getRandomImage":return getRandomImage(e);case"getRandomSong":return getRandomSong(e);case"getArticleById":return getArticleById(e);case"getVersion":return getVersion(e);case"updateUserInfo":return updateUserInfo(e);case"addComment":return addComment(e);case"uploadLogs":return uploadLogs(e);case"getNoticeList":return getNoticeList(e);case"updateUserNotice":return updateUserNotice(e);default:return Promise.reject("empty function")}});