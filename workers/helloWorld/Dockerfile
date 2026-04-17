FROM python:3.13

WORKDIR /helloWorld

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY main.py .

CMD ["python", "-u", "main.py"]