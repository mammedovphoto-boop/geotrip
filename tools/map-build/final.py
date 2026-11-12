import glob,os,shutil,numpy as np
from PIL import Image
S='mt'; F='mt/satF'
shutil.rmtree(F,ignore_errors=True)
for z in (6,7,8): shutil.copytree(f'{S}/sat/{z}',f'{F}/{z}')
for z in (10,11,12,13): shutil.copytree(f'{S}/sat25/{z}',f'{F}/{z}')
kids={tuple(map(int,f[:-4].split('/')[-2:])) for f in glob.glob(f'{F}/10/*/*.jpg')}
for X,Y in {(x>>1,y>>1) for x,y in kids}:
    p=Image.open(f'{F}/8/{X>>1}/{Y>>1}.jpg').convert('RGB'); qx,qy=(X&1)*128,(Y&1)*128
    c=p.crop((qx,qy,qx+128,qy+128)).resize((512,512),Image.BICUBIC)
    for dx in (0,1):
        for dy in (0,1):
            f=f'{F}/10/{2*X+dx}/{2*Y+dy}.jpg'
            if os.path.exists(f): c.paste(Image.open(f).convert('RGB'),(dx*256,dy*256))
    os.makedirs(f'{F}/9/{X}',exist_ok=True); c.resize((256,256),Image.LANCZOS).save(f'{F}/9/{X}/{Y}.jpg',quality=92)
print([len(glob.glob(f'{F}/{z}/*/*')) for z in range(6,14)])
