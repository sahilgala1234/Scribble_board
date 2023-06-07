import numpy as np
import os
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import optimizers
from tensorflow.keras.layers import Input
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, Flatten, Reshape, Dropout
from tensorflow.keras.layers import Convolution1D, MaxPooling1D, BatchNormalization
from tensorflow.keras.layers import Lambda
from importlib import reload # reload
import pandas as pd
import ast
import json
reload(tf)
from keras.utils import np_utils
from keras.utils.np_utils import to_categorical
from tensorflow.keras.callbacks import ModelCheckpoint
#tf.config.experimental_run_functions_eagerly(True)
tf.compat.v1.disable_eager_execution()
lab=['heart','circle']
num_points = 2048
def load_data(str):
    #str=json.loads(str)
    print(str['label'])
    print(str['points'][0])
    i= str['label']
    x= str['points'][0]
    print("x",x)
    label=2
    for j in range(len(lab)):
     if i==lab[j]:
       label=j
   
    
    q=[]
    for y in x:
         q.append([float(y[0]), float(y[1]), float(0)]) 
    q=scale(q)
    q=upsample(q)   
    print(len(q))
    print('q',q)     

   
    return label, q
lab=['heart','circle']
def scale(points):
    centroid = np.mean(points, axis=0)
    points -= centroid
    furthest_distance = np.max(np.linalg.norm(points))
    points /= furthest_distance
    return points

def upsample(p):
   a=[]
   b=[]
   for j in range(len(p)-1):
        b.append([(p[j][0]+p[j+1][0])/2,(p[j][1]+p[j+1][1])/2, 0.0])
   if len(p)+len(b) >= num_points:
             g=-len(p)+num_points
             r=0 
             e=0
             
             for x in range(num_points):
                 if e==len(p):
                     break
                 a.append(p[e])
                 e+=1
                 if g>0:
                  a.append(b[r])
                  r+=1
                  x+=1
                  g-=1
             return a     
   else:
        r=0
        e=0
        g=len(b)
        for x in range(len(p)+len(b)-1):
                 if e==len(p):
                     break
                 a.append(p[e])
                 e+=1
                 if g>0:
                  a.append(b[r])
                  r+=1
                  x+=1
                  g-=1
        return upsample(a)
   return
                                

         
                 
def mat_mul(A, B):
    return tf.matmul(A, B)

def rotate_point_cloud(batch_data):
    rotated_data = np.zeros(batch_data.shape, dtype=np.float32)
    for k in range(batch_data.shape[0]):
        rotation_angle = np.random.uniform() * 2 * np.pi
        cosval = np.cos(rotation_angle)
        sinval = np.sin(rotation_angle)
        rotation_matrix = np.array([[cosval, sinval], [-sinval, cosval]])
        shape_pc = batch_data[k, ...]
        rotated_data[k, ...] = np.dot(shape_pc.reshape((-1, 3)), rotation_matrix)
    return rotated_data


from tensorflow.python.client import device_lib
print(device_lib.list_local_devices())



k = 9 # 0 cuboid, 1 cylinder , 2 spheres, 3 prism, 4 pyramids

adam = tf.keras.optimizers.legacy.Adam(lr=0.001, decay=0.3)
o=0.01
input_points = Input(shape=(num_points, 3))
x = Convolution1D(64, 1, activation=keras.layers.LeakyReLU(alpha=o) ,input_shape=(num_points, 3))(input_points)
x = BatchNormalization()(x)
x = Convolution1D(128, 1, activation=keras.layers.LeakyReLU(alpha=o))(x)
x = BatchNormalization()(x)
x = Convolution1D(1024, 1, activation=keras.layers.LeakyReLU(alpha=o))(x)
x = BatchNormalization()(x)
x = MaxPooling1D(pool_size=num_points)(x)
x = Dense(512, activation=keras.layers.LeakyReLU(alpha=o))(x)
x = BatchNormalization()(x)
x = Dense(256, activation=keras.layers.LeakyReLU(alpha=o))(x)
x = BatchNormalization()(x)
x = Dense(9, weights=[np.zeros([256, 9]), np.array([1, 0, 0, 0, 1, 0, 0, 0, 1]).astype(np.float32)])(x)
input_T = Reshape((3, 3))(x)

# Forward net
g = Lambda(mat_mul, arguments={'B': input_T})(input_points)
g = Convolution1D(64, 1, input_shape=(num_points, 3), activation=keras.layers.LeakyReLU(alpha=o))(g)
g = BatchNormalization()(g)
g = Convolution1D(64, 1, input_shape=(num_points, 3), activation=keras.layers.LeakyReLU(alpha=o))(g)
g = BatchNormalization()(g)

# Feature Transform net
f = Convolution1D(64, 1, activation=keras.layers.LeakyReLU(alpha=o))(g)
f = BatchNormalization()(f)
f = Convolution1D(128, 1, activation=keras.layers.LeakyReLU(alpha=o))(f)
f = BatchNormalization()(f)
f = Convolution1D(1024, 1, activation=keras.layers.LeakyReLU(alpha=o))(f)
f = BatchNormalization()(f)
f = MaxPooling1D(pool_size=num_points)(f)
f = Dense(512, activation=keras.layers.LeakyReLU(alpha=o))(f)
f = BatchNormalization()(f)
f = Dense(256, activation=keras.layers.LeakyReLU(alpha=o))(f)
f = BatchNormalization()(f)
f = Dense(64 * 64, weights=[np.zeros([256, 64 * 64]), np.eye(64).flatten().astype(np.float32)])(f)
feature_T = Reshape((64, 64))(f)

# Forward net
g = Lambda(mat_mul, arguments={'B': feature_T})(g)
g = Convolution1D(64, 1, activation=keras.layers.LeakyReLU(alpha=o))(g)
g = BatchNormalization()(g)
g = Convolution1D(128, 1, activation=keras.layers.LeakyReLU(alpha=o))(g)
g = BatchNormalization()(g)
g = Convolution1D(1024, 1, activation=keras.layers.LeakyReLU(alpha=o))(g)
g = BatchNormalization()(g)

# Global_feature
global_feature = MaxPooling1D(pool_size=num_points)(g)

# Point_net_classification
c = Dense(512, activation=keras.layers.LeakyReLU(alpha=o))(global_feature)
c = BatchNormalization()(c)
c = Dropout(rate=0.2)(c)
c = Dropout(rate=0.2)(c)
c = Dense(256, activation=keras.layers.LeakyReLU(alpha=o))(c)
c = BatchNormalization()(c)
c = Dropout(rate=0.2)(c)
c = Dense(k, activation='softmax')(c)
prediction = Flatten()(c)

model = Model(inputs=input_points, outputs=prediction)
model.compile(optimizer='adam',
                  loss='categorical_crossentropy',
                  metrics=['accuracy'])
graph = tf.compat.v1.get_default_graph()
model.load_weights('./classification_weights4.h5')
print("Weights loaded !")
import threading
lab=['heart','circle','diamond','hand','leaf','like','moon','square','triangle']

from keras import backend as K
Session = tf.compat.v1.keras.backend.get_session()
__Graph = tf.compat.v1.get_default_graph()
def infer(str):
    x,y=load_data(str)
    y=np.asarray(y).reshape(1, 2048, 3)
    print(y.shape, 'bruh')
    print(x)
    #from keras.models import load_model
    with Session.as_default():
        with __Graph.as_default():
           pred = model.predict(y)
    print(pred)
    print('infer')
    return lab[np.asarray(pred).argmax()]


  

