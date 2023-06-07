from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.http import JsonResponse
from .infer import *

def receive_array(request):
    if request.method == 'POST':
        received_array = request.POST.getlist('my_array[]')
        print(received_array)
        # Do something with the received array here
        return JsonResponse({'success': True})
    return JsonResponse({'error': 'Invalid request method'})
#View which will render the landing page

def base(request):
    return render(request,"base.html")
def whiteboard(request):
    return render(request,'whiteboard.html')
def login(request):
    return render(request, 'login.html')
def register(request):
    return render(request, 'register.html')
def home(request):
    return render(request, 'home.html')

def my_view(request):
    #import bruh
    if request.method == "POST":
        my_string = request.POST.get("my_string")
        #bruh.collect(my_string)+
        h=json.loads(my_string)
        t={'label': h['label'], 'points': [h['points']]}
        pred=infer(t)
        print(pred)
        #write_csv(t, 'data.csv')
        print(h)
        #print(my_string)
        # Do something with the string
        return JsonResponse({"message": "{}".format(pred)})
    else:
        return JsonResponse({"message": "Invalid request method"})